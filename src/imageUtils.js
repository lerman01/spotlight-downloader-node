import fetch from "node-fetch";
import fs from "fs";
import {areBuffersEqual} from "./bufferUtils.js";

const VALID_FILE_NAME_REGEX = "^((?!\\W|^R(.){5,6}$).|,| | |-|\\.|\\(|\\)|')*$";

export const currentImages = {};

export const downloadImage = async (url) => {
    const response = await fetch(url);
    return Buffer.from(await response.arrayBuffer());
}

export const saveImage = (imageData) => {
    let filename = imageData.name ?? imageData.id;
    try {
        fs.writeFileSync(`images/${filename}.png`, imageData.content);
    } catch (e) {
        filename = imageData.id;
        fs.writeFileSync(`images/${filename}.png`, imageData.content);
    }
    console.log(`Saved new image: ${filename}`);
    return filename;
}

export const loadCurrentImages = () => {
    let filenames;
    try {
        filenames = fs.readdirSync('images').map(filename => filename.substring(0, filename.lastIndexOf('.')));
    } catch (e) {
        fs.mkdirSync('images');
        return;
    }
    for (const filename of filenames) {
        currentImages[filename] = fs.readFileSync(`images/${filename}.png`);
    }
}

export const isImageExists = (newImage) => {
    const filenames = Object.keys(currentImages);
    for (const filename of filenames) {
        if (currentImages[filename] && areBuffersEqual(newImage.content, currentImages[filename])) {
            return filename;
        }
    }
    return false;
}

export const isRenameRequired = (existsFilename, newFilename) => {
    const oldFileNeedRename = !existsFilename.match(VALID_FILE_NAME_REGEX);
    const newFileIsValidName = newFilename?.match(VALID_FILE_NAME_REGEX);
    return oldFileNeedRename && newFileIsValidName;
}

export const renameImage = (oldFilename, newFilename) => {
    fs.renameSync(`images/${oldFilename}.png`,`images/${newFilename}.png`)
}