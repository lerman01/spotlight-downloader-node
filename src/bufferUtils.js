export const areBuffersEqual = (bufA, bufB) => {
    const len = bufA.length;
    if (len !== bufB.length) {
        return false;
    }
    for (let i = 0; i < len; i++) {
        if (bufA.readUInt8(i) !== bufB.readUInt8(i)) {
            return false;
        }
    }
    return true;
}