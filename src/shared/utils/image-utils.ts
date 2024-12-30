const imageMapping : Record<string, string | null> = {
    csv: "csv.svg",
    xls: "xls.svg",
    xlsx: "xlsx.svg",
    png: "image.svg",
    jpg: "image.svg",
    jpeg: "image.svg",
    unknown: null,
}

export function getNodeImage(node: {[name: string]: any}) {
    return imageMapping[node['type']] || imageMapping["unknown"];
}