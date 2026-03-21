import os
try:
    import PyPDF2
except ImportError:
    import sys
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2"])
    import PyPDF2

pdf_path = "d:/Others/projects/Gym_FitBoch/fitboch/lib/ai/PROM ALIMENTACION.pdf"
try:
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        print("--- PDF CONTENT START ---")
        print(text)
        print("--- PDF CONTENT END ---")
except Exception as e:
    print(f"Error: {e}")
