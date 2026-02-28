import { FC } from "react";
import "../styles/Error.css";

const ErrorScreen: FC = () => {
    return (
        <div className="Err-container">
            
            <div className="textArea">
        <p className="error-header">
        It seems you've run into a problem...<br/>
        </p>``
        </div>
        <p className="error-text">
            Please check the following:<br/>
            1. make sure the thresholds are correct.<br/>
            2.  try to refresh the page and start over.<br/>
        </p>
        <p className="error-text">if you need help, please contact us at</p>
        <p className="error-text">omrinahor@gmail.com</p>
        <p className="error-text">noace@jce.ac.il</p>

        </div>
    )
}


export default ErrorScreen;
