**Implementing the extension enabled workbook on a server for the first time.**

![image](https://user-images.githubusercontent.com/77290618/117015825-16bb3d00-acc0-11eb-9d97-5f618585ab42.png)

1) Publish this repo on Github pages. 
2) Download the workbook and .trex file
3) Change the <URL> paramater to the github pages link
4) Open the workbook, add the extension to the "Alberta Health Infections Report" Dashboard by finding the .trex file.
5) Connnect Workbook To Datasource (**see below**)
6) Publish the Workbook to Tableau Server
7) Whitelist the github pages URL on Tableau server.

**Datasources**:
1) The first data source is named VOC_Nodes, which is the "nodes" data from VOC_ALL_Links_No_Null.json.
2) The second data source is named VOC_Links, which is the "links" data from VOC_ALL_Links_No_Null.json
3) Publish them to the server, and 

![image](https://user-images.githubusercontent.com/77290618/117015524-d0fe7480-acbf-11eb-9bbc-124251965345.png)
