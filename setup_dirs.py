import os

dirs = [
    r'src\app\api\auth\forgot-password',
    r'src\app\api\auth\reset-password',
    r'src\app\forgot-password',
    r'src\app\reset-password\[token]',
]

for dir_path in dirs:
    full_path = os.path.join(os.getcwd(), dir_path)
    os.makedirs(full_path, exist_ok=True)
    print(f'Created: {full_path}')
