def evaluate_dictation(text, typed, time_taken):
    correct = 0

    for i in range(min(len(text), len(typed))):
        if text[i] == typed[i]:
            correct += 1

    total = len(typed)

    accuracy = (correct / total) * 100 if total > 0 else 0

    minutes = time_taken / 60
    wpm = ((total / 5) / minutes) if minutes > 0 else 0

    return {
        "wpm": round(wpm, 2),
        "accuracy": round(accuracy, 2)
    }