// Reference: https://stackoverflow.com/questions/7225407/convert-camelcasetext-to-sentence-case-text
export function camelToTitle(camel) {
	let title = camel.replace(/([A-Z])/g, " $1");
	title = title.charAt(0).toUpperCase() + title.slice(1);
	return title;
}
