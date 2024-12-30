function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

function intToHex(int: number): string {
    const hex = int.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

function stringToColor(str: string): string {
    const hash = hashString(str);
    const r = (hash >> 24) & 0xff;
    const g = (hash >> 16) & 0xff;
    const b = (hash >> 8) & 0xff;
    return `#${intToHex(r)}${intToHex(g)}${intToHex(b)}`;
}

const colors = [
    {name: 'page', value: '#22A75E'},
    {name: 'pdf', value: '#14B8A6'},
    {name: 'red', value: '#EF4444'},
    {name: 'orange', value: '#F59E0B'},
]

const getColor = (name: string) => {
    return colors.find(elm => elm.name === name)?.value ?? '#DDDDDD';
}

export { stringToColor, getColor }