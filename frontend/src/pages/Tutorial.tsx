import { FC } from "react";
import "../styles/Tutorial.css";
import example_rows from "../assets/tutorial images/example_rows.png";
import set_params from "../assets/tutorial images/set_params.png";
import graph from "../assets/tutorial images/graph.png";
import graph_bar from "../assets/tutorial images/graph_bar.png";
import others from "../assets/tutorial images/others.png";
import protein_names from "../assets/tutorial images/protein_names.png";
import table from "../assets/tutorial images/table.png";
import manual_thresholds from "../assets/tutorial images/manual_thresholds.png";
import download_data from "../assets/tutorial images/download_data.png";
import save_results_menu from "../assets/tutorial images/save_results_menu.png";

import Menu_Basic_Layouts from '../assets/tutorial images/menu_Basic_Layouts.png';
import Menu_Cluster_Layout from '../assets/tutorial images/Menu_Cluster_Layout.png';
import Menu_LCSL from '../assets/tutorial images/Menu_LCSL.png';
import Menu_Download from '../assets/tutorial images/Menu_Download.png';
import Menu_Edge_Opacity from '../assets/tutorial images/Menu_Edge_Opacity.png';
import Menu_Node_Color from '../assets/tutorial images/Menu_Node_Color.png';
import Menu_Node_Size from '../assets/tutorial images/Menu_Node_Size.png';
import Menu_save_load from '../assets/tutorial images/Menu_save_load.png';
import Menu_SaveGraphs from '../assets/tutorial images/Menu_SaveGraphs.png';

import { openLink } from "../common/GeneralCommon";
import { downloadExampleFile } from "../common/ExampleFileAction";

const Tutorial: FC = () => {
  const stringdbLink = "https://string-db.org/";
  const drugsDatabaseLink = "https://data.tp53.org.uk/cancerdrugs.php";
  return (
    <div className="page-container">
      <div className="tutorial-container">
        <h1 className="t-h1">ProteinNetworkSight Tutorial</h1>
        {/* <p className="t-p note">
          Note: In addition to the documentation a video tutorial will be
          uploaded soon.
        </p> */}
        {/* Summary DIV */}
        <div>
          <h2 className="t-h2">Summary</h2>
          <p className="t-p">Our tool works with two existing databases:</p>
          <ol type="a">
            <li className="t-li">
              <button
                className="btn--here"
                onClick={() => {
                  openLink(stringdbLink);
                }}
              >
                String-db
              </button>
              , an online tool and a database of known and predicted
              protein-protein interactions
            </li>
            <li className="t-li">
              <button
                className="btn--here"
                onClick={() => {
                  openLink(drugsDatabaseLink);
                }}
              >
                Cancer Drugs Database
              </button>
              , a database that provides a listing of licensed cancer drugs
            </li>
          </ol>
          <p className="t-p">
            ProteinNetworkSight is an open source tool for calculating patient-specific
            protein networks based on integrating the input from the user with
            the information retrieved from String-db.
          </p>
        </div>
        {/* Starting Point DIV */}
        <div>
          <h2 className="t-h2">Starting Point </h2>
          <p className="t-p">
            For the user to begin, they must upload an Excel / CSV / TSV file on a single sheet (or a TXT that represents an Excel file), 
            where each row represents a protein or gene and each column represents a feature. 
            The file must not contains more than 2000 rows, 
            where each row represents a protein/gene and the columns are features to be analysed. 
            The file should contain a column of protein/gene names as well as additional column(s) of numeric values. 
            These numeric values represent gene/protein scores or quantitative metrics—such as loadings obtained from Principal Component Analysis (PCA), 
            weights from information-theoretic analyses, or simple fold changes. The first line is the header, 
            specifying column names. Note that the names of the numeric columns should start with the same prefix.
          </p>
          {/* <p className="t-p">
            For the user to begin, they must upload an Excel / CSV / TSV file on a single sheet (or a TXT that represents an Excel file),
            where each row represents a protein or gene and each column represents a feature. 
            It is recommended that the file contains up to 2000 rows.
            such that each row represents a protein/gene and the columns
            are features to be analysed. The file should contain a column of
            protein/gene names as well as additional column(s) of numeric
            values. Numeric values can represent gene/protein scores (as
            obtained from for example principal component analysis (PCA) or
            information-theoretic) or simple fold changes. The first line is the
            header, specifying column names. Note that the names of the numeric
            columns should start with the same prefix.
          </p> */}
          <p className="t-p">
            <button className="btn--here" onClick={downloadExampleFile}>
              Here
            </button>
            &nbsp;you can find an example file (fetched from Vasudevan et al., npj Precision Oncology, 2021, Supplementary Data 1). 
            For example, here are 10 rows of the example file, 
            where the gene column is named “UID” and the header of the numerical columns start with “G”, followed by some index. In this specific example, 
            the columns labeled "G" represent the weights of proteins participating in computed patterns as dictated by 
            the information-theoretic analysis presented in Vasudevan et al. 
            However, this format is flexible: the "G" columns can be replaced by any other scores, 
            coefficients, or fold changes, depending on the specific method the user employs to find co-expression patterns.
            {/* &nbsp;you can find an example file (fetched from Vasudevan et al.,
            npj Precision Oncology, 2021, Supplementary Data 1). For example,
            here are 10 rows of the example file, where the gene column is named
            “UID” the header of the numerical columns start with “G”, followed
            by some index. */}
          </p>
          <img className="t-img" src={example_rows} alt="example_rows" />
        </div>
        {/* Setting parameters and thresholds DIV */}
        <div>
          <h2 className="t-h2">Setting parameters and thresholds </h2>
          <p className="t-p">In this step the user should specify:</p>
          <ol type="a">
            <li className="t-li">
              The header name of the gene protein / gene column (in the example
              file it is “UID”)
            </li>
            <li className="t-li">
              The prefix shared by the names of the numerical columns (in the
              example file it is “G”, Gi - is a weight of each protein in a
              pattern (vector) G1, G2, G3 etc.)
            </li>
            <li className="t-li">
              Thresholds for defining the lower limit for String interaction
              score, representing a probability of interaction between each pair
              of examined proteins. The thresholds are defined according to
              STRING-db
            </li>
            <li className="t-li">
              Positive and negative thresholds for excluding values within this
              range of protein scores (for example what is the the minimum score
              to be included in the network analysis)
            </li>
            <li className="t-li">
              Organism of interest (in the example file, it is “Homo sapiens”)
            </li>
          </ol>
          <img className="t-img" src={set_params} alt="set_params" />
        </div>
        {/* Adjusting protein/gene names DIV */}
        <div>
          <h2 className="t-h2">Manual thresholds adjustments </h2>
          <p className="t-p">
          <li className="t-li">
              You can also choose to adjust the thresholds of every G column in the graph
              individually.
          </li>
          </p>
          <img className="t-img" src={manual_thresholds} alt="manual_thresholds"/>
        </div>
        <div>
          <h2 className="t-h2">Adjusting protein/gene names </h2>
          <p className="t-p">
            Our tool connects to&nbsp;
            <button
              className="btn--here"
              onClick={() => {
                openLink(stringdbLink);
              }}
            >
              String-db
            </button>
            &nbsp;
            in order to create and visualise protein networks. Thus,
            protein/gene names specified in the input file should match the
            names used by String-db. Genes often have multiple names, so it is
            possible that the user used a gene whose name was different in the
            input file and in String-db. The next two steps highlight such cases
            and allow the users to choose different names.
          </p>
          <img className="t-img" src={protein_names} alt="protein_names"/>
          <img className="t-img" src={others} alt="others"/>
        </div>
        {/* Results page DIV */}
        <div>
          <h2 className="t-h2">Results page</h2>
          <p className="t-p">
            The resulting network comprises nodes representing the input score
            values, where node size is proportional to the input protein score
            value. The edges are derived from STRING-db, with edge width
            indicating the probability of a protein-protein interaction. The
            information can be viewed and downloaded in either a tabular or network format.
            The network format provides an interactive visualization of the network online, 
            allowing for zooming, dragging, and more complex manipulation of the
            network.
          </p>
          <h3 className="t-h3">Graph representation</h3>
          <p className="t-p">
            The graphical representation displays a network where each node
            symbolizes a protein. Node size is directly proportional to the input
            value, and node color indicates the sign of the value (blue for positive
            values and red for negative values). The edges connecting each pair of
            proteins represent functional protein-protein interactions, with the
            width of each edge corresponding to the probability of such an
            interaction.
          </p>
          <img className="t-img" src={graph} alt="graph"/>
          <img className="t-img" src={graph_bar} alt="graphBar"/>
          <p className="t-p">
            In this illustration, multiple protein interactions are depicted. For instance, 
            TIGAR is represented with a positive, sizeable value (indicated by the blue color) 
            and interacts with LKB1, which also has a positive but smaller value, as well as with GAPDH, 
            which is represented by a negative value (indicated by the red color). 
            Additionally, it can be inferred that ACC1 interacts with both BCL2 and FASN, with BCL2 demonstrating 
            a higher likelihood of interaction, as evidenced by the thicker edge connecting the two proteins.
          </p>
          <p className="t-p">
              Note that clicking on individual nodes will reveal additional information about the corresponding protein.<br/>
              Users can also interactively reposition nodes within the graph to facilitate optimal visualization and facilitate the extraction of meaningful insights from the data.<br/>
          </p>
          <p className="t-p">
            The context menu accessible via right-click in the graph visualization enables users to adjust visual properties and customize the appearance of the graph to facilitate better comprehension of the data or to prepare visualizations for publication.
          </p>
          <p className="t-p">
            We offer a diverse range of layout options designed to visually organize nodes, enhancing your ability to extract meaningful insights from the graph.<br/>
            Presented below are three fundamental options that are broadly applicable to any graph.<br/>
          </p>
          <img className="t-img" src={Menu_Basic_Layouts} alt="right_click_menu"/>
          <p className="t-p">
            Additionally, advanced layout options utilizing various clustering algorithms are available to provide an alternative visualization of the graph's structure.<br/>
            We recommend exploring each of these options, as they can uncover valuable insights and reveal unique properties of the graph.<br/>
          </p>
          <img className="t-img" src={Menu_Cluster_Layout} alt="cluster_graph_layout"/>

          <p className="t-p">
            If you would like to see more information about the layouts, you can find them at <a href="https://blog.js.cytoscape.org/2020/05/11/layouts/#choice-of-layout">cytoscape.js layouts</a>.
            <br/>
            If you would like for us to add a new Layout, please contact us!<br/>
          </p>

          <p className="t-p">
            Additionally, we provide a novel, hand-crafted cluster finding algorithm - named LCSL(Layered Cluster Spiral Layout) - 
            which utilizes the link weights to identify clusters and organize each cluster in a spiral pattern, 
            taking into account the weights of each node's links. This algorithm is designed to facilitate the discovery and prioritization of proteins and their respective drugs for optimal therapeutic effect.
          </p>
          <img className="t-img" src={Menu_LCSL} alt="LCSL"/>

          <p className="t-p">
            To help with visualizing the graph, we provide a few additional options focused on aesthetics.<br/>
          </p>

          <p className="t-p">
            The node color option allows you to change the color of the nodes from 6 predefined options, which are applied separately to positive 
            and negative nodes, enabling you to differentiate between them more easily.<br/>
          </p>
          <img className="t-img" src={Menu_Node_Color} alt="node color"/>

          <p className="t-p">
            The node size option allows you to change the size of all the nodes, while maintaining their relative size.<br/>
            This is usually helpful when you want to change the ratio of Node:Text or Node:Edge.<br/>
          </p>
          <img className="t-img" src={Menu_Node_Size} alt="node size"/>

          <p className="t-p">
            The Edge Opacity option allows you to change the opacity of the edges, and make them more or less visible 
            while maintaining their relative visability<br/>
          </p>
          <img className="t-img" src={Menu_Edge_Opacity} alt="edge opacity"/>

          <p className="t-p">
            Once you have reached a desired state, you can save the graph by using the "Save" option on the menu
            Which will allow you to load the graph in the future after exploring more changed<br/>
          </p>
          <img className="t-img" src={Menu_save_load} alt="cluster_graph_layout"/>

          <p className="t-p">
            Alternativly, if you wish to continue working in another app, or export the result for further analysis, you can download 
            the graph in one of 3 formats:<br/>
            1. a .svg file(graph format)<br/>
            2. a .png file(picture format)<br/>
            3. a .json file(data format)<br/>
          </p>
          <img className="t-img" src={Menu_Download} alt="cluster_graph_layout"/>
          
          <h3 className="t-h3">Table representation</h3>
          <p className="t-p">
            The table representation contain the following columns:
          </p>
          <ul>
            <li className="t-li">
              Original name (the input name for each protein)
            </li>
            <li className="t-li">
              String name (the modified name according to String-db).
            </li>
            <li className="t-li">
              Node value - an input score (as was calculated by using, for
              example, PCA or surprisal analysis)
            </li>
            <li className="t-li">
              Node degree - a number of protein partners each examined protein
              has
            </li>
            <li className="t-li">
              Weighted node degree -Sum of weighted links as provided by STRING's DB and defined as the probability for functional connetion

            </li>
            <li className="t-li">
              Final score -  the average between the node's size (i.e., absolute value of protein’s score) and weighted node degree.

            </li>
            <li className="t-li">
              Drug - a known anticancer drug as obtained from the&nbsp;
              <button
                className="btn--here"
                onClick={() => {
                  openLink(drugsDatabaseLink);
                }}
              >
                Cancer Drugs Database
              </button>
            </li>
          </ul>
          <img className="t-img" src={table} alt="table"/>

          <p className="t-p">
            There are also several ways to save or download your work so you can keep working offline or with other tools<br/>
            click Save in the bottom of the Results window to enter the Saving page
          </p>
          <img className="t-img" src={save_results_menu} alt="save_table"/>

          <ul>
            <li className="t-li">
              <p>
                Saving your Data - in this mode you can make final changes before downloading your modified data file.<br/>
                In the left list, you can see all of your names with alternative or manual matches to the STRING DB as defined in steps 3 and 4.<br/>
                If you would like to stop using your original name, you can replace it with the STRING match by clicking the arrow button<br/>
                In the right list are the names in your files that dont ccurrently have a match in the STRING DB<br/>
                Since they dont appear in the graphs, if you are happy with it you can remove them from the data by pressing the X button<br/>
              </p>
            </li>
            <img className="t-img" src={download_data} alt="save_table"/>

            <li className="t-li">
              <p>
                Saving your Graphs - in this mode you can make final changes before downloading all of the networks.<br/>
                You can apply a setting to all the graphs by using the top menu<br/>
                Mark "use preset when available" to use that setting only on graph without a saved layout<br/>
                Notice that the page is initialized with preset values for every graph that you have saved<br/>
                If you moved a node manualy before saving a graph, the layout will be saved as preset<br/>
              </p>
            </li>
            <img className="t-img" src={Menu_SaveGraphs} alt="save_table"/>
          </ul>

        </div>
        {/* Browser compatibility DIV */}
        <div>
          <h2 className="t-h2">Browser compatibility</h2>
          <p className="t-p">
            A summary of the website's browser compatibility, specifying the
            checked version per OS and browser:
          </p>
          <table className="browser-support">
            <thead>
              <tr>
                <th>OS</th>
                <th>Version</th>
                <th>Chrome</th>
                <th>Edge</th>
                <th>Firefox</th>
                <th>Safari</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Windows</td>
                <td>10/11</td>
                <td>143</td>
                <td>143</td>
                <td>145</td>
                <td>n/a</td>
              </tr>
              <tr>
                <td>MacOS</td>
                <td>Sonoma</td>
                <td>143</td>
                <td>143</td>
                <td>n/a</td>
                <td>17.3</td>
              </tr>
              <tr>
                <td>Linux</td>
                <td>PopOS</td>
                <td>143</td>
                <td>n/a</td>
                <td>n/a</td>
                <td>n/a</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
