import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import axios from 'axios';

// Domain of your frontend
const hostname = 'https://www.nursingvidya.shop';

// Basic static routes
const staticLinks = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/login', changefreq: 'monthly', priority: 0.8 },
    { url: '/signup', changefreq: 'monthly', priority: 0.8 },
];

async function generateSitemap() {
    console.log('Generating sitemap...');
    const links = [...staticLinks];

    try {
        // Fetch dynamic routes (e.g., all PDFs) from your backend
        const response = await axios.get('https://api.nursingvidya.shop/api/pdfs');
        
        // Assuming response.data is an array of pdfs or contains the pdf array
        const pdfs = Array.isArray(response.data) ? response.data : (response.data.pdfs || []);
        
        pdfs.forEach(pdf => {
            links.push({ url: `/pdf/${pdf._id}`, changefreq: 'weekly', priority: 0.7 });
        });
        
        if (pdfs.length > 0) {
            console.log(`Added ${pdfs.length} dynamic PDF routes.`);
        }
    } catch (error) {
        console.warn('Note: Could not fetch dynamic PDF routes (they were skipped). Adjust the API endpoint or ensure it is public. Error:', error.message);
    }

    try {
        const stream = new SitemapStream({ hostname });
        
        // Return a promise that resolves with your XML string
        const xmlData = await streamToPromise(Readable.from(links).pipe(stream));
        
        // Write the XML string to the public folder
        createWriteStream('./public/sitemap.xml').write(xmlData.toString());
        console.log('Sitemap successfully generated at ./public/sitemap.xml');
    } catch (error) {
        console.error('Error generating sitemap:', error);
    }
}

generateSitemap();
