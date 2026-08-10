import pandas as pd
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

print("⏳ Loading dataset...")
try:
    # Fixed to match your exact file name
    df = pd.read_csv('udmeydataset.csv')
except FileNotFoundError:
    print("❌ Error: Could not find 'udmeydataset.csv'. Make sure it is in the same folder!")
    exit()

title_col = 'course_title' if 'course_title' in df.columns else df.columns[1]
subject_col = 'subject' if 'subject' in df.columns else df.columns[11]
level_col = 'level' if 'level' in df.columns else df.columns[8]

# --- 1. ADVANCED DATA CLEANING ---
# Drop rows with missing critical info
df = df.dropna(subset=[title_col, subject_col])

# Drop duplicate course names to keep recommendations unique
df = df.drop_duplicates(subset=[title_col])

# Normalize text casing and whitespace so searches never fail due to formatting
df[title_col] = df[title_col].astype(str).str.lower().str.strip()
df[subject_col] = df[subject_col].astype(str).str.lower().str.strip()
df[level_col] = df[level_col].astype(str).str.lower().str.strip()

# --- 2. FILTER: Keep ONLY Web Development & Programming ---
df = df[df[subject_col].str.contains('web development|programming', case=False, na=False)].reset_index(drop=True)

print(f"✅ Cleaned & Filtered Dataset! Total developer courses remaining: {len(df)}")

# 3. Fill any empty string gaps safely
df[title_col] = df[title_col].fillna('')
df[subject_col] = df[subject_col].fillna('')
df[level_col] = df[level_col].fillna('')

# 4. Feature Engineering
df['combined_features'] = df[title_col] + " " + df[subject_col] + " " + df[level_col]

print("🧠 Training the Machine Learning Model on Developer Content...")
vectorizer = TfidfVectorizer(stop_words='english')
feature_matrix = vectorizer.fit_transform(df['combined_features'])

cosine_sim_matrix = cosine_similarity(feature_matrix, feature_matrix)

def get_recommendations(title, df_ref, matrix):
    try:
        # Match lowercased search query
        query_title = title.lower().strip()
        idx = df_ref[df_ref[title_col] == query_title].index[0]
        sim_scores = list(enumerate(matrix[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        top_indices = [i[0] for i in sim_scores[1:6]]
        return df_ref[title_col].iloc[top_indices].tolist()
    except IndexError:
        return ["Course not found! Check the exact spelling."]

# --- EXPORT RESULTS FOR THE FRONTEND (JSON BRIDGE) ---
# This builds a dictionary of recommendations for all courses and saves it to a file
# so your Node.js backend can serve it straight to your web UI seamlessly.
print("📦 Generating JSON export for the frontend UI...")
recommendations_dict = {}
for i, row in df.iterrows():
    c_title = row[title_col]
    recommendations_dict[c_title] = get_recommendations(c_title, df, cosine_sim_matrix)

with open('recommendations.json', 'w', encoding='utf-8') as f:
    json.dump(recommendations_dict, f, ensure_ascii=False, indent=4)

print("✅ Model trained and saved to 'recommendations.json' successfully!")

# --- TEST THE MODEL ---
test_course = df[title_col].iloc[0] 
print(f"\n🔮 Because you watched '{test_course}', DevTube recommends:")
recs = get_recommendations(test_course, df, cosine_sim_matrix)
for i, rec in enumerate(recs, 1):
    print(f"{i}. {rec}")