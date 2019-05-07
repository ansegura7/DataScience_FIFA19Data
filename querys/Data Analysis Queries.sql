USE LOCAL_DEV
GO
-- 1. Countries with more players
SELECT TOP 10 [Nationality], COUNT(*) AS [count]
  FROM [dbo].[FIFA_19_Data]
 WHERE [Nationality] IS NOT NULL
 GROUP BY [Nationality]
 ORDER BY [count] DESC;
GO
-- Best 10 players
SELECT TOP 10 [Name], [Overall]
  FROM [dbo].[FIFA_19_Data]
 ORDER BY [Overall] DESC;
GO
-- Best 10 players with more potential
SELECT TOP 10 [Name], [Potential]
  FROM [dbo].[FIFA_19_Data]
 ORDER BY [Potential] DESC;
GO
-- Best 10 players - improvement margen
SELECT TOP 10 [Name], [Overall] AS [CurrentOverall], ([Potential] - [Overall]) AS [RealPotential], [Value]
  FROM [dbo].[FIFA_19_Data]
 WHERE [Overall] > 80
 ORDER BY [RealPotential] DESC;
GO
-- Players Overall Average per Club
SELECT TOP 10 [Club], AVG([Overall]) AS [AvgOverall]
  FROM [dbo].[FIFA_19_Data]
 WHERE [Club] IS NOT NULL
 GROUP BY [Club]
 ORDER BY [AvgOverall] DESC;
GO
-- Potential Average per Club
SELECT TOP 10 [Club], AVG([Potential]) AS [AvgPotential]
  FROM [dbo].[FIFA_19_Data]
 WHERE [Club] IS NOT NULL 
 GROUP BY [Club]
 ORDER BY [AvgPotential] DESC;
GO