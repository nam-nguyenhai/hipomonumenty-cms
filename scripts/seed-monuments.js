'use strict';

/**
 * Monument Import Script
 * 
 * Usage:
 *   # Export to JSON only (no Strapi import) - for review
 *   npm run seed:monuments -- --export-only
 * 
 *   # Import from previously reviewed JSON
 *   npm run seed:monuments -- --from-json
 * 
 *   # Full import directly from Excel
 *   npm run seed:monuments
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Path to the Excel file
const EXCEL_FILE_PATH = '/Users/keeper/Downloads/2021_01_07_hipomonumenty_Neumann_MOBILE_DESC.xlsx';

// Type mapping from Excel values to schema enum values
const typeMap = {
  'socha': 'Socha',
  'sportoviště': 'Sportoviště',
  'budova': 'Budova',
  'budovy': 'Budova',
  'freska': 'Freska',
  'reliéf': 'Reliéf',
};

/**
 * Trim text to first N sentences (fallback for missing descriptions)
 */
function trimToSentences(text, maxSentences = 2) {
  if (!text) return null;

  const sentences = text.match(/[^.!?]+[.!?]+/g);

  if (!sentences || sentences.length === 0) {
    return text.length > 200 ? text.substring(0, 200).trim() + '...' : text;
  }

  return sentences.slice(0, maxSentences).join(' ').trim();
}

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(text) {
  if (!text) return null;
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Parse the Excel file and extract monument data
 */
function parseExcelFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const monuments = [];

  // Start from row 6 (index 5) where actual data begins
  // Row 3 (index 2) is the header row
  for (let i = 5; i < data.length; i++) {
    const row = data[i];

    // Skip empty rows or rows without OK status
    if (!row || !row[0] || row[0] !== 'OK') {
      continue;
    }

    // Skip rows without a title
    const titleCZ = row[2];
    if (!titleCZ || typeof titleCZ !== 'string' || titleCZ.trim() === '') {
      continue;
    }

    // Map type value
    const rawType = row[6];
    let type = null;
    if (rawType && typeof rawType === 'string') {
      const normalizedType = rawType.toLowerCase().trim();
      type = typeMap[normalizedType] || null;
    }

    // Compose address from multiple columns
    const street = row[7] || '';
    const district = row[8] || '';
    const postalCode = row[9] || '';
    const addressParts = [street, district, postalCode].filter(Boolean);
    const address = addressParts.join(', ') || null;

    // Parse available field
    const availableRaw = row[17];
    let available = null;
    if (availableRaw && typeof availableRaw === 'string') {
      const normalized = availableRaw.toLowerCase().trim();
      if (normalized === 'ano') {
        available = true;
      } else if (normalized === 'ne') {
        available = false;
      }
    }

    // Clean up latitude/longitude
    const latitude = row[10] ? String(row[10]).trim() : null;
    const longitude = row[11] ? String(row[11]).trim() : null;

    // Build monument object
    // Column M (index 12) = Czech perex/content
    // Column N (index 13) = English perex/content  
    // Column X (index 23) = Czech description (NEW - from ChatGPT)
    // Column Y (index 24) = English description (NEW - from ChatGPT)
    const monument = {
      ordinalNumber: row[1],
      // Czech locale data
      cs: {
        title: titleCZ.trim(),
        shortTitle: row[3] ? String(row[3]).trim() : null,
        slug: generateSlug(titleCZ),
        // Perex goes to content (full text)
        content: row[12] ? String(row[12]).trim() : null,
        // Description from Excel (ChatGPT generated) - Column X
        description: row[23] ? String(row[23]).trim() : null,
      },
      // English locale data
      en: {
        title: row[4] ? String(row[4]).trim() : null,
        shortTitle: row[5] ? String(row[5]).trim() : null,
        slug: row[4] ? generateSlug(row[4]) : null,
        // Perex goes to content (full text)
        content: row[13] ? String(row[13]).trim() : null,
        // Description from Excel (ChatGPT generated) - Column Y
        description: row[24] ? String(row[24]).trim() : null,
      },
      // Shared data (same for both locales in this case)
      shared: {
        type,
        address,
        latitude,
        longitude,
        phone: row[14] ? String(row[14]).trim() : null,
        website: row[15] ? String(row[15]).trim() : null,
        availableDescription: row[16] ? String(row[16]).trim() : null,
        available,
        imageFolder: row[18] ? String(row[18]).trim() : null,
        mainImage: row[19] ? String(row[19]).trim() : null,
      },
    };

    monuments.push(monument);
  }

  return monuments;
}

/**
 * Set public permissions for monument API
 */
async function setPublicPermissions() {
  console.log('Setting public permissions for monument API...');

  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  if (!publicRole) {
    console.log('Public role not found, skipping permissions setup');
    return;
  }

  const actions = ['find', 'findOne'];
  const permissionsToCreate = [];

  for (const action of actions) {
    // Check if permission already exists
    const existingPermission = await strapi.query('plugin::users-permissions.permission').findOne({
      where: {
        action: `api::monument.monument.${action}`,
        role: publicRole.id,
      },
    });

    if (!existingPermission) {
      permissionsToCreate.push(
        strapi.query('plugin::users-permissions.permission').create({
          data: {
            action: `api::monument.monument.${action}`,
            role: publicRole.id,
          },
        })
      );
    }
  }

  if (permissionsToCreate.length > 0) {
    await Promise.all(permissionsToCreate);
    console.log(`Created ${permissionsToCreate.length} permissions`);
  } else {
    console.log('Permissions already exist');
  }
}

/**
 * Process monuments - fill in missing descriptions with trimmed content
 */
function processMonuments(monuments) {
  // Fill in missing descriptions with trimmed content as fallback
  for (const monument of monuments) {
    if (!monument.cs.description && monument.cs.content) {
      monument.cs.description = trimToSentences(monument.cs.content, 2);
    }
    if (!monument.en.description && monument.en.content) {
      monument.en.description = trimToSentences(monument.en.content, 2);
    }
  }
  return monuments;
}

/**
 * Import monuments into Strapi
 */
async function importMonuments(monuments) {
  console.log(`Importing ${monuments.length} monuments...`);

  let successCount = 0;
  let errorCount = 0;

  for (const monument of monuments) {
    try {
      // Prepare Czech data
      const czechData = {
        title: monument.cs.title,
        shortTitle: monument.cs.shortTitle,
        slug: monument.cs.slug,
        description: monument.cs.description,
        content: monument.cs.content,
        type: monument.shared.type,
        address: monument.shared.address,
        latitude: monument.shared.latitude,
        longitude: monument.shared.longitude,
        phone: monument.shared.phone,
        website: monument.shared.website,
        availableDescription: monument.shared.availableDescription,
        available: monument.shared.available,
      };

      // Create monument in Czech locale (published)
      const doc = await strapi.documents('api::monument.monument').create({
        data: czechData,
        locale: 'cs',
        status: 'published',
      });

      console.log(`Created monument (cs): ${monument.cs.title}`);

      // If English data exists, create English localization
      if (monument.en.title) {
        const englishData = {
          title: monument.en.title,
          shortTitle: monument.en.shortTitle,
          slug: monument.en.slug,
          description: monument.en.description,
          content: monument.en.content,
          type: monument.shared.type,
          address: monument.shared.address,
          latitude: monument.shared.latitude,
          longitude: monument.shared.longitude,
          phone: monument.shared.phone,
          website: monument.shared.website,
          availableDescription: monument.shared.availableDescription,
          available: monument.shared.available,
        };

        await strapi.documents('api::monument.monument').update({
          documentId: doc.documentId,
          data: englishData,
          locale: 'en',
          status: 'published',
        });

        console.log(`  Added English localization: ${monument.en.title}`);
      }

      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`Error importing monument "${monument.cs.title}":`, error.message);
    }
  }

  console.log(`\nImport complete: ${successCount} succeeded, ${errorCount} failed`);
}

/**
 * Export monuments to JSON file for review
 * Structure matches the monument content-type schema
 */
function exportToJSON(monuments) {
  // Transform to Strapi-compatible format
  const exportData = monuments.map((monument, index) => ({
    // Metadata (not imported to Strapi, just for reference)
    _meta: {
      ordinalNumber: monument.ordinalNumber,
      imageFolder: monument.shared.imageFolder,
      mainImage: monument.shared.mainImage,
    },
    // Czech locale data
    cs: {
      title: monument.cs.title,
      slug: monument.cs.slug,
      shortTitle: monument.cs.shortTitle,
      description: monument.cs.description,
      content: monument.cs.content,
      type: monument.shared.type,
      address: monument.shared.address,
      latitude: monument.shared.latitude,
      longitude: monument.shared.longitude,
      phone: monument.shared.phone,
      website: monument.shared.website,
      available: monument.shared.available,
      availableDescription: monument.shared.availableDescription,
    },
    // English locale data
    en: monument.en.title ? {
      title: monument.en.title,
      slug: monument.en.slug,
      shortTitle: monument.en.shortTitle,
      description: monument.en.description,
      content: monument.en.content,
      type: monument.shared.type,
      address: monument.shared.address,
      latitude: monument.shared.latitude,
      longitude: monument.shared.longitude,
      phone: monument.shared.phone,
      website: monument.shared.website,
      available: monument.shared.available,
      availableDescription: monument.shared.availableDescription,
    } : null,
  }));

  const outputPath = path.join(__dirname, '../data/monuments-export.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`\nExported ${monuments.length} monuments to: ${outputPath}`);
  console.log('Review the file and then import with: npm run seed:monuments -- --from-json');
}

/**
 * Import monuments from previously exported JSON file
 */
function loadFromJSON() {
  const jsonPath = path.join(__dirname, '../data/monuments-export.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found: ${jsonPath}\nRun with --export-only first.`);
  }
  const data = fs.readFileSync(jsonPath, 'utf-8');
  const monuments = JSON.parse(data);
  
  // Transform back to internal format for import
  return monuments.map(m => ({
    ordinalNumber: m._meta?.ordinalNumber,
    cs: {
      title: m.cs.title,
      shortTitle: m.cs.shortTitle,
      slug: m.cs.slug,
      content: m.cs.content,
      description: m.cs.description,
    },
    en: m.en ? {
      title: m.en.title,
      shortTitle: m.en.shortTitle,
      slug: m.en.slug,
      content: m.en.content,
      description: m.en.description,
    } : { title: null, shortTitle: null, slug: null, content: null, description: null },
    shared: {
      type: m.cs.type,
      address: m.cs.address,
      latitude: m.cs.latitude,
      longitude: m.cs.longitude,
      phone: m.cs.phone,
      website: m.cs.website,
      available: m.cs.available,
      availableDescription: m.cs.availableDescription,
      imageFolder: m._meta?.imageFolder,
      mainImage: m._meta?.mainImage,
    },
  }));
}

/**
 * Main function
 */
async function main() {
  // Check for command line flags
  const exportOnly = process.argv.includes('--export-only');
  const fromJSON = process.argv.includes('--from-json');

  console.log('='.repeat(60));
  console.log('Monument Import Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${exportOnly ? 'EXPORT ONLY' : fromJSON ? 'IMPORT FROM JSON' : 'FULL IMPORT'}`);
  console.log('='.repeat(60) + '\n');

  let monuments;

  if (fromJSON) {
    // Load from previously exported JSON
    console.log('Loading monuments from JSON file...');
    monuments = loadFromJSON();
    console.log(`Loaded ${monuments.length} monuments from JSON`);
  } else {
    // Parse Excel file
    console.log(`Reading Excel file: ${EXCEL_FILE_PATH}`);
    monuments = parseExcelFile(EXCEL_FILE_PATH);
    console.log(`Found ${monuments.length} monuments in Excel file`);

    if (monuments.length === 0) {
      console.log('No monuments found in Excel file. Exiting.');
      process.exit(0);
    }

    // Process monuments (fill in missing descriptions)
    monuments = processMonuments(monuments);
  }

  // If export-only mode, save to JSON and exit
  if (exportOnly) {
    exportToJSON(monuments);
    process.exit(0);
  }

  // Load Strapi for import
  const { createStrapi, compileStrapi } = require('@strapi/strapi');
  
  console.log('Loading Strapi...');
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';

  try {
    // Set public permissions
    await setPublicPermissions();

    // Import monuments
    await importMonuments(monuments);
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await app.destroy();
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
