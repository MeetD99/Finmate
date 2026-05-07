import os, sys
from dotenv import load_dotenv
load_dotenv('.env')
sys.path.append(os.getcwd())
try:
    import app
    print('App imported successfully')
except Exception as e:
    print('Import error:', e)
