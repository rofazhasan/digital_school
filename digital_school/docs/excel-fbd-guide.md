# Excel Bulk Upload - Inline FBD Guide

## Overview
Embed Free Body Diagrams (FBD) **directly in your text** using `## ##` delimiters - just like LaTeX uses `$$ $$`!

## How It Works

### Inline FBD Syntax
Wrap FBD code in `## ##` delimiters anywhere in your text:

```
A 10 kg block rests on a 30° incline. ##PRESET:incline(30,10,true)## Calculate the normal force.
```

The `##PRESET:incline(30,10,true)##` will be replaced with an actual diagram!

## Where You Can Use It

✅ **Question Text**
✅ **Options** (A, B, C, D, E)
✅ **Explanations**
✅ **Model Answers**
✅ **Sub-Questions** (for CQ type)

Basically, **anywhere you can write text**!

## Format Options

### Option 1: Presets (Recommended) ⭐

```
##PRESET:incline(30,10,true)##
##PRESET:hanging(5)##
##PRESET:pulley(5,3)##
##PRESET:beam(400,100)##
```

### Option 2: Custom Format

```
##P1(300,200,O) | F1@P1(80,0,F1,applied) F2@P1(60,90,N,normal) | axes=true##
```

## Excel Examples

### Example 1: FBD in Question Text

| Type | Class | Subject | Question Text | Marks |
|------|-------|---------|---------------|-------|
| SQ | Class 10 | Physics | A 10 kg block rests on a 30° incline. ##PRESET:incline(30,10,true)## Calculate: a) Normal force b) Friction force | 5 |

### Example 2: FBD in Model Answer

| Type | Question Text | Model Answer | Marks |
|------|---------------|--------------|-------|
| SQ | Calculate the tension in a string holding a 5kg mass. | The forces acting on the mass are: ##PRESET:hanging(5)## Tension T = mg = 5 × 9.8 = 49N | 4 |

### Example 3: FBD in MCQ Option

| Type | Question Text | Option A | Option B | Correct Option |
|------|---------------|----------|----------|----------------|
| MCQ | Which diagram correctly shows forces on a hanging mass? | ##PRESET:hanging(5)## | ##PRESET:incline(30,10,false)## | A |

### Example 4: FBD in Explanation

| Type | Question Text | Correct Option | Explanation |
|------|---------------|----------------|-------------|
| MCQ | What is the direction of normal force? | B | The normal force acts perpendicular to the surface. ##PRESET:incline(30,10,true)## As shown, N is perpendicular to the incline. | 

### Example 5: Multiple FBDs in One Question

| Question Text |
|---------------|
| Compare the two systems: System A: ##PRESET:hanging(5)## System B: ##PRESET:pulley(5,3)## Which has greater tension? |

### Example 6: FBD in Sub-Question

| Type | Question Text | Sub-Question 1 Text | Sub-Question 1 Answer |
|------|---------------|---------------------|----------------------|
| CQ | A block-pulley system | Draw the FBD for the hanging mass | The FBD is: ##PRESET:hanging(5)## showing tension T upward and weight mg downward. |

## Complete Examples

### Physics Problem with Inline FBD

```
Question: A 10 kg block rests on a 30° incline with friction coefficient μ = 0.3.

##PRESET:incline(30,10,true)##

Calculate:
a) The normal force
b) The maximum static friction force
c) Will the block slide?

Model Answer:
From the FBD above:
- Weight: mg = 10 × 9.8 = 98 N
- Normal force: N = mg cos(30°) = 84.87 N
- Friction: f_max = μN = 0.3 × 84.87 = 25.46 N
```

### MCQ with Diagrams in Options

```
Question: Which free body diagram correctly represents a 5kg mass hanging from a string?

Option A: ##PRESET:hanging(5)##
Option B: ##PRESET:incline(30,5,false)##
Option C: ##P1(300,200) | F1@P1(100,0,T,tension)##
Option D: ##PRESET:pulley(5,3)##

Correct: A

Explanation: A hanging mass has two forces: tension T upward and weight mg downward, both acting on the center of mass. ##PRESET:hanging(5)## This is correctly shown in option A.
```

## Preset Reference

| Preset | Syntax | Parameters |
|--------|--------|------------|
| Block on Incline | `##PRESET:incline(angle,mass,friction)##` | angle (degrees), mass (kg), friction (true/false) |
| Hanging Mass | `##PRESET:hanging(mass)##` | mass (kg) |
| Pulley System | `##PRESET:pulley(mass1,mass2)##` | mass1 (kg), mass2 (kg) |
| Beam | `##PRESET:beam(length,load)##` | length (units), load (N) |

## Custom Format Reference

**Syntax:**
```
##POINTS | FORCES | OPTIONS##
```

**Example:**
```
##P1(300,200,O) | F1@P1(100,270,mg,weight) F2@P1(100,90,T,tension) | axes=true##
```

**Components:**
- **Points**: `P1(x,y,label)`
- **Forces**: `F1@P1(magnitude,angle,label,type)`
- **Types**: `weight`, `normal`, `friction`, `tension`, `applied`
- **Angles**: `0°=→`, `90°=↑`, `180°=←`, `270°=↓`

## Tips

### ✅ DO:
- Use `## ##` delimiters (like LaTeX `$$ $$`)
- Embed FBDs anywhere in text
- Use presets for common diagrams
- Add FBDs to questions, options, explanations
- Use multiple FBDs in one question if needed

### ❌ DON'T:
- Don't use a separate FBD column
- Don't forget the `##` delimiters
- Don't nest FBDs inside each other
- Don't use line breaks inside `## ##` blocks

## Comparison with LaTeX

| Feature | LaTeX | FBD |
|---------|-------|-----|
| Delimiter | `$$ $$` | `## ##` |
| Inline | `$E=mc^2$` | `##PRESET:hanging(5)##` |
| Block | `$$\sum F = 0$$` | `##PRESET:incline(30,10,true)##` |
| Location | Anywhere in text | Anywhere in text |

## Quick Examples

**Simple:**
```
The FBD is: ##PRESET:hanging(5)##
```

**In sentence:**
```
As shown in ##PRESET:incline(30,10,true)##, the normal force is perpendicular.
```

**Multiple:**
```
Compare ##PRESET:hanging(5)## with ##PRESET:pulley(5,3)##
```

**Custom:**
```
The equilibrium condition ##P1(300,200) | F1@P1(100,0,F,applied) F2@P1(100,180,F,applied)## shows balanced forces.
```

---

**No separate column needed!** Just use `## ##` anywhere in your text! 🎉
