// export const serverUrl = "https://medmolnet.jce.ac/backend/api/";
export const serverUrl = process.env.REACT_APP_SERVER_URL!;

export function openLink (link: string): void{
    window.open(link, "_blank");
}
