# Visual and Data Analysis - FIFA 19
- **Created by Andrés Segura Tinoco**
- **Created on May 1, 2019**

![PCA Results](https://raw.githubusercontent.com/ansegura7/DataScience_FIFA19Data/master/images/pca-results.jpg)

## Abstract
Data Science Project to analyze and discover insights of the attributes of each player registered in the latest edition of FIFA 19 database.

## Data
Detailed attributes for every player registered in the latest edition of FIFA 19 database:
- Original data from <a href="https://www.kaggle.com/karangadiya/fifa19" target="_blank" >Kaggle</a>
- Project data in <a href="https://github.com/ansegura7/DataScience_FIFA19Data/tree/master/data" target="_blank" >GitHub</a>

## Analysis List
1. <a href="https://ansegura7.github.io/DataScience_FIFA19Data/pages/InitialExploration.html" target="_blank" >Exploration and Profiling</a>
2. <a href="https://ansegura7.github.io/DataScience_FIFA19Data/pages/QueryingData.html" target="_blank" >Querying Data</a>
3. <a href="https://ansegura7.github.io/DataScience_FIFA19Data/pages/PrincipalComponentAnalysis.html" target="_blank" >Principal Component Analysis</a>
4. <a href="https://ansegura7.github.io/DataScience_FIFA19Data/pages/ClusteringData.html" target="_blank" >Clustering Data - KMeans</a>
5. <a href="https://ansegura7.github.io/DataScience_FIFA19Data/pages/ForceSystem.html" target="_blank" >Networks and Force System</a>

## Insights
- It is possible to perform a PCA of the skills of the players and maintain 80.5% of the variance of the data with only 2 components. Which allows us to plot the players on the plane and analyze which players resemble each other.
- The similarity between players is better identified with 2 components (2D plot and 80.5% variance explained) than with 3 components (3D plot and 84.8% variance explained).
- Using the Jambu Elbow technique, you can visually select a k = 4 (number of clusters between which the data will be grouped).
- Players can be grouped into 4 groups. These groups are highly related to the zones in which players play on the field (goalkeepers, defenders, midfielders and strikers).
- Others:
    - The team with the most potential is FC Barcelona, whose players initially have an overall average of 78 but can reach 85.
    - The player with the most potential is MBappe from PSG, who can reach 95 of overall.
    - However, the player with the most improvement margen is Donnarumma of AC Milan, who initially has an overall of 82 but can reach 83 (+11).

## Technologies and Techniques
- Python 3.7.3
- <a href="https://www.anaconda.com/distribution/" target="_blank" >Anaconda Navigator 1.9.7</a>
- Jupyter Notebook 5.7.8
- Force System of d3.js
- Principal Component Analysis (PCA)
- K-Means

## Python Libraries
- pandas
- pandas_profiling
- numpy
- pandasql
- sklearn
- StandardScaler
- PCA
- KMeans
- matplotlib.pyplot
- mpl_toolkits.mplot3d
- seaborn
- ipywidgets

## License Type
This project is licensed under the terms of the MIT license.
