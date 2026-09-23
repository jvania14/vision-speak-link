import pickle
import pandas as pd

with open("model.p", "rb") as f:
    model_dict = pickle.load(f)
model = model_dict["model"]

df = pd.read_csv("dataset.csv")
print("Dataset shape:", df.shape)
print("Unique labels:", sorted(df.iloc[:, 0].astype(str).unique()))

feature_cols = df.columns[1:]
X = df[feature_cols].values
y_true = df.iloc[:, 0].astype(str).values

preds = model.predict(X).astype(str)
overall_acc = (preds == y_true).mean()
print(f"\nOverall accuracy on dataset.csv: {overall_acc:.4f}")

print(f"\n{'label':<8}{'count':<8}{'accuracy':<10}")
for label in sorted(set(y_true)):
    mask = y_true == label
    acc = (preds[mask] == y_true[mask]).mean()
    print(f"{label:<8}{mask.sum():<8}{acc:<10.3f}")