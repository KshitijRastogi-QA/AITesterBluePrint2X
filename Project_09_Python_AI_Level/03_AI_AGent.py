model = "claude-sonnet-4-20250514"
model2 = "gpt-5.4"
model3 = "gemini-2.5-flash"
task = "summarize bug reports"
prompt = f"You are {model}. Your task is to {task}."
print(prompt)
