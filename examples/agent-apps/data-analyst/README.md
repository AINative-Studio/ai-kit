# Data Analysis Agent

AI-powered data analysis with CSV/Excel file processing, SQL query generation, statistical analysis, and interactive visualizations.

## Features

- **File Support**: CSV, Excel (XLSX), JSON
- **SQL Query Generation**: Natural language to SQL
- **Statistical Analysis**: Descriptive statistics, correlations, distributions
- **Visualizations**: Bar charts, line graphs, pie charts, scatter plots, histograms
- **Jupyter Integration**: Export analysis to Jupyter notebooks
- **Report Generation**: PDF/HTML reports with charts and insights
- **Natural Language Queries**: Ask questions about your data

## Installation

```bash
npm install
```

## Usage

### Web Interface

```bash
npm run dev
# Open http://localhost:3004
```

### Upload Data

1. Upload CSV/Excel file
2. Ask natural language questions
3. View generated SQL queries
4. Explore statistics and visualizations
5. Export results

### API

```bash
POST /api/analyze
{
  "dataSource": "sales_data.csv",
  "fileType": "csv",
  "query": "What are the top 10 products by revenue?",
  "analysisType": "descriptive",
  "visualizations": true
}
```

## Analysis Types

- **Descriptive**: Summarize data characteristics
- **Diagnostic**: Understand why something happened
- **Predictive**: Forecast future trends
- **Prescriptive**: Recommend actions

## Example Queries

- "What's the average sales by region?"
- "Show me the trend over time"
- "Which products have declining sales?"
- "Identify outliers in the dataset"
- "Compare performance across categories"

## Jupyter Integration

```python
# Export analysis to Jupyter notebook
from data_analyst import export_notebook

export_notebook('analysis-123', 'output.ipynb')
```

## Testing

```bash
npm test
```

## Deployment

See main deployment guide.
