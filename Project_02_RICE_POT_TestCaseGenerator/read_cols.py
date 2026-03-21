import pandas as pd
xl = pd.ExcelFile('Test cases - Ultimate _ TheTestingAcademy.xlsx')
for sn in xl.sheet_names:
    df = pd.read_excel('Test cases - Ultimate _ TheTestingAcademy.xlsx', sheet_name=sn)
    print(f"[{sn}] columns:", df.columns.tolist())
