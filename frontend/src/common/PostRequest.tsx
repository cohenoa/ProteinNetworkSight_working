import { serverUrl } from "./GeneralCommon";

export const makePostRequest = (
  body: string,
  route: string,
  handleJsonString: (jsonString: string) => void,
  handleError?: (error: string) => void
  ) => {
  /*
  Sends a HTTP request to the server for the route with body,
  updating the progress bar according to the request status,
  performing the given handleJsonString when done.
  */
  let headers = new Headers();

  headers.append("Content-Type", "application/json");
  console.log(serverUrl);
  fetch(serverUrl + route, {
    mode: "cors",
    method: "POST",
    headers: headers,
    body: body,
  })
    .then((response) => response.json())
    .then((json) => {
      const jsonString = JSON.stringify(json);
      handleJsonString(jsonString);
    })
    .catch(error => handleError && handleError(error));
};
