// export const serverUrl = "http://localhost/backend/api/";
export const serverUrl = process.env["REACT_APP_API_URL"] + "/backend/api/";

export function openLink (link: string): void{
    window.open(link, "_blank");
}
