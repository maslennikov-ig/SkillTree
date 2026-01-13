This is a comprehensive design specification for a **"Wow Factor" RIASEC Career Report**.

This design moves away from dry "test results" and frames the report as a **"Strategic Roadmap for the Future."** It combines the visual engagement of a "Spotify Wrapped" with the analytical depth of a McKinsey report, tailored specifically for the Russian educational context.

---

### **I. Design System & Technical Strategy**

* **Visual Theme:** "The Future Architect" (Архитектор Будущего).
* *Style:* Clean, Swiss-style typography, ample white space, and bold geometric data visualizations.
* *Color Palette:* Uses the standard Holland colors but modernized for print:
* 🔴 **Realistic:** `#E74C3C` (Terra Cotta)
* 🟣 **Investigative:** `#8E44AD` (Deep Purple)
* 🟠 **Artistic:** `#F39C12` (Vibrant Orange)
* 🟢 **Social:** `#27AE60` (Growth Green)
* 🔵 **Enterprising:** `#2980B9` (Strong Blue)
* 🟤 **Conventional:** `#34495E` (Structured Slate)




* **Typography:**
* *Headings:* **Montserrat** (Bold/ExtraBold) – Modern, highly readable.
* *Body:* **Roboto** or **Open Sans** – Best cross-platform support for Cyrillic in PDF generators.


* **Technical Constraints (PDFKit/wkhtmltopdf):**
* **Layout:** Use **HTML Tables** or `float`-based layouts for columns. Avoid complex `flexbox` or `grid` as older rendering engines often break them across pages.
* **Charts:** Do **not** use JavaScript (Chart.js/D3). Generate high-resolution **PNG/SVG images** using Python (Matplotlib/Seaborn) and embed them as Base64 strings.
* **Fonts:** Must be embedded via Base64 in CSS to ensure Russian characters render correctly on all servers.



---

### **II. Report Sections (Detailed Architecture)**

#### **1. Cover Page (Титульный лист)**

* **Concept:** "The Unique Fingerprint."
* **Visuals:** A large, abstract geometric shape (e.g., a Voronoi diagram) generated algorithmically using the student's top 3 RIASEC colors. No two covers look exactly alike.
* **Content:**
* **Top Right:** Organization Logo.
* **Center:**
* Title: **СТРАТЕГИЯ ПРОФЕССИОНАЛЬНОГО РАЗВИТИЯ** (Professional Development Strategy).
* Subtitle: **Персональный навигатор карьеры**.


* **Bottom:**
* Prepared for: **[Student Name]**.
* Date: [Date].
* Profile ID: **#8824-RU** (Adds a "verified" feel).





#### **2. Executive Summary (Резюме Профиля)**

* **Goal:** The "Cheat Sheet" for busy parents.
* **Layout:** Dashboard Grid (3 horizontal panels).
* **Content:**
1. **The Code:** Large icons displaying the Holland Code (e.g., **I-A-S**).
2. **The Archetype:** A creative title (e.g., **"The Innovative Architect"**).
3. **Top Match:** The #1 Career with a "98% Match" badge.


* **Parent Hook (The "Fit Meter"):**
* *Visual:* A "Battery" icon.
* *Text:* "Этот профиль описывает человека, который заряжается от решения сложных задач (I) и творчества (A), но теряет энергию от рутины (C)."



#### **3. Understanding Your RIASEC Profile (Анатомия Интересов)**

* **Pages:** 2-3
* **Visuals:**
* **The Radar:** A large Spider Chart. Overlay the student's polygon (Color) on top of the "Average Teenager" polygon (Grey) to highlight uniqueness.
* **The Breakdown:** 6 Horizontal bars showing normalized scores (0-100).


* **Content Strategy:**
* Use **"Energy Language"** instead of "Skills."
* *High Score:* "Activities that recharge you."
* *Low Score:* "Activities that drain you."


* **Russian Text Example:**
* *Dimension:* **Предприимчивый (E)**.
* *Interpretation:* "Вы — драйвер изменений. Вам нравится лидировать, убеждать и продавать идеи. Работа в одиночестве (без команды) будет вас угнетать."



#### **4. Your Personality Archetype (Ваш Архетип)**

* **Pages:** 1-2
* **Concept:** Identity Building.
* **Structure:**
1. **Formula:** `Investigative (I)` + `Artistic (A)` = **"THE VISIONARY CREATOR"**.
2. **Narrative:** A paragraph describing their working style in a positive light.
3. **Celebrity Lookalikes:** "Люди вашего типа" (e.g., Steve Jobs, Marie Curie) with photos.


* **Wow Factor:**
* **"Superpower Card":** A distinct box listing 3 key strengths (e.g., "Abstract Thinking," "Creative Problem Solving," "Independence").



#### **5. Growth Areas & Development (Точки Роста)**

* **Pages:** 2
* **Concept:** Reframing weaknesses as "Delegation Zones" or "Challenges."
* **Content:**
* Identify the lowest 2 scores.
* **The "Why":** Explain *why* this is low (e.g., "You prefer big pictures over details").
* **Actionable Challenge:** A specific task to build this muscle.


* **Russian Text Example:**
* *Weakness:* **Low Conventional (C)**.
* *Advice:* "Низкий балл здесь — это не лень, а любовь к свободе. Но чтобы ваши идеи не пропали, нужна минимальная система."
* *Task:* "**Челлендж:** Вести Google-календарь в течение 1 недели без пропусков."



#### **6. Top Career Matches (Топ Профессий)**

* **Pages:** 3-4
* **Layout:** "Career Trading Cards" (1 Major card per page for Top 3).
* **Card Components:**
1. **Header:** Job Title (e.g., **UX/UI Designer**) + Match % Gauge.
2. **Logic:** "Why You?" (Connects RIASEC letters to job tasks).
3. **Data Dashboard:**
* *Salary (RF):* 80k - 250k ₽ (Bar chart: Junior -> Senior).
* *Demand:* "High / Growing" (Icon: Rocket).


4. **Skills Checklist:** Hard & Soft skills needed.


* **Market Context:** Mention specific Russian platforms (e.g., "Relevant for Yandex, VK, Sber").

#### **7. Labor Market Insights (Рынок Труда РФ)**

* **Pages:** 1
* **Content:**
* **Future-Proofing:** An "AI Risk Meter" (Low/Med/High).
* **Trends:** "Import Substitution" (Импортозамещение) impact on this field.


* **Russian Text Example:**
* "В условиях цифровизации экономики РФ, спрос на специалистов вашего профиля (IT + Creative) вырос на 40% за последний год."



#### **8. Educational Pathways (Образовательная Траектория)**

* **Pages:** 1-2
* **Visual:** A Timeline Roadmap (Grade 9 -> Grade 11 -> University).
* **Content:**
* **University Majors:** Specific codes (e.g., **09.03.03 Прикладная информатика**).
* **Exams (EGE):** Recommended subjects (Math Profile, Informatics).
* **Alternatives:** Bootcamps (Yandex Practicum, Skillbox).



#### **9. Skills Development Roadmap (Карта Навыков)**

* **Pages:** 1-2
* **Concept:** "The RPG Skill Tree."
* **Layout:** Two columns (Hard Skills vs. Soft Skills).
* **Gap Analysis:**
* *You Have:* Empathy, Logic.
* *You Need:* Python, Public Speaking.


* **Resources:** Links to specific books (e.g., "Пиши, сокращай") or courses.

#### **10. Your Achievements (Достижения)**

* **Pages:** 1
* **Concept:** Gamification badges to boost confidence.
* **Badges:**
* 🏅 **"Вдумчивый Аналитик"** (Took time to answer).
* 🚀 **"Яркая Личность"** (High differentiation).
* ⚖️ **"Человек Баланса"** (Well-rounded profile).



#### **11. Action Plan (План Действий)**

* **Pages:** 1
* **Structure:**
* **Checklist:** 30 / 60 / 90 Days.
* **Parent Guide:** "Questions to ask at dinner" (not "How much does it pay?", but "What sounds fun?").
* **Signature Line:** A "Contract with Myself" for the student to sign.



#### **12. Appendix (Приложение)**

* **Content:** Methodology explanation, Data sources (hh.ru, Rosstat), Glossary.

---

### **III. Technical Implementation Guide (Python + PDFKit)**

**1. Generate Charts as Images (Python):**
PDFKit cannot render complex JS charts. You must generate them as Base64 strings using Matplotlib.

```python
import matplotlib.pyplot as plt
import numpy as np
import io
import base64

def get_radar_chart_base64(scores):
    # Setup
    labels = ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional']
    stats = scores + [scores[0]] # Close the loop
    angles = np.linspace(0, 2*np.pi, len(labels), endpoint=False).tolist()
    angles += angles[:1]
    
    # Plot
    fig, ax = plt.subplots(figsize=(6, 6), subplot_kw=dict(polar=True))
    ax.fill(angles, stats, color='#8E44AD', alpha=0.25) # Purple fill
    ax.plot(angles, stats, color='#8E44AD', linewidth=2)
    
    # Styling
    ax.set_yticklabels([])
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, size=10, weight='bold')
    
    # Save to Base64
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', transparent=True)
    plt.close()
    return base64.b64encode(buf.getvalue()).decode('utf-8')

```

**2. CSS for Robust Layouts:**
Use these classes to ensure the report looks professional and doesn't break awkwardly.

```css
/* Force Page Breaks */
.page-break { page-break-before: always; }

/* Prevent Cards from splitting across pages */
.no-break { page-break-inside: avoid; }

/* Embed Fonts (Crucial for Russian) */
@font-face {
    font-family: 'Montserrat';
    src: url(data:font/truetype;charset=utf-8;base64,AAEAAA...);
}

/* 2-Column Layout (Float is safer than Flexbox for PDFKit) */
.col-left { width: 48%; float: left; }
.col-right { width: 48%; float: right; }
.clearfix { clear: both; }

```