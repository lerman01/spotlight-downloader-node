import countryCodes from 'country-codes-list'
import async from "async";
import fetch from 'node-fetch';
import https from 'https';

import {
    currentImages,
    downloadImage,
    isImageExists,
    isRenameRequired,
    loadCurrentImages,
    renameImage,
    saveImage
} from "./imageUtils.js";

const PID_LIST = ["338387", "209567", "279978", "209562"];
const COUNTRY_LIST = countryCodes.all();
const CONCURRENCY_JOBS = 100;


const httpsAgent = new https.Agent({rejectUnauthorized: false});

const getImageUrl = async () => {
    const response = await fetch(`https://arc.msn.com/v3/Delivery/Placement?pid=${PID_LIST[Math.floor(Math.random() * PID_LIST.length)]}&ctry=${COUNTRY_LIST[Math.floor(Math.random() * COUNTRY_LIST.length)].countryCode}&lc=${COUNTRY_LIST[Math.floor(Math.random() * COUNTRY_LIST.length)].officialLanguageCode}&lo=${Math.floor(Math.random() * 10000000)}&fmt=json&cdm=1`,
        {
            agent: httpsAgent,
            headers: {
                "accept-language": "en-US,en;q=0.9,he-IL;q=0.8,he;q=0.7",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
            }
        });
    const json = await response.json();
    if (!json.batchrsp.errors) {
        const innerJson = JSON.parse(json.batchrsp.items[0].item);
        const url = innerJson.ad.image_fullscreen_001_landscape.u
        return {
            url: innerJson.ad.image_fullscreen_001_landscape.u,
            name: innerJson.ad.title_text?.tx,
            id: url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('?'))
        };
    }
    return null;
}

const doJob = async (endJob) => {
    const imageData = await getImageUrl();

    if (imageData) {
        imageData.content = await downloadImage(imageData.url);
        const existsImageFilename = isImageExists(imageData);
        if (!existsImageFilename) {
            const filename = saveImage(imageData);
            currentImages[filename] = imageData.content;
        } else if (isRenameRequired(existsImageFilename, imageData.name)) {
            console.log(`Rename ${existsImageFilename} to ${imageData.name}`);
            await renameImage(existsImageFilename, imageData.name);
            currentImages[imageData.name] = imageData.content;
            currentImages[existsImageFilename] = undefined;

        }
    }
    endJob();
}

const start = async () => {
    loadCurrentImages();

    const pushTask = () => {
        q.push({}, pushTask);
    }

    const q = async.queue((task, endJob) => {
        doJob(endJob);
    }, CONCURRENCY_JOBS);

    for (let i = 0; i < CONCURRENCY_JOBS; i++) {
        pushTask();
    }
}

start();