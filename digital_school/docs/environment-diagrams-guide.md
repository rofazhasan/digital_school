# Environment-Specific Diagrams Guide

## Overview
Show the **same physics scenario in different environments** (air, water, fire/hot gas, vacuum) to demonstrate how medium affects motion!

## Available Environment Presets

### Pendulum in Different Mediums

**Syntax:**
```
##PRESET:pendulum-air(length,angle)##
##PRESET:pendulum-water(length,angle)##
##PRESET:pendulum-fire(length,angle)##
##PRESET:pendulum-vacuum(length,angle)##
```

**Examples:**
```
Pendulum in air: ##PRESET:pendulum-air(100,30)##
Pendulum in water: ##PRESET:pendulum-water(100,30)##
Pendulum in fire: ##PRESET:pendulum-fire(100,30)##
Pendulum in vacuum: ##PRESET:pendulum-vacuum(100,30)##
```

**Forces Shown:**
- **Air**: Tension, Weight, Drag (small)
- **Water**: Tension, Weight, Drag (large), Buoyancy
- **Fire/Hot Gas**: Tension, Weight, Drag (medium), Thermal force
- **Vacuum**: Tension, Weight only (no drag)

---

### Projectile in Different Mediums

**Syntax:**
```
##PRESET:projectile-air(velocity,angle)##
##PRESET:projectile-water(velocity,angle)##
##PRESET:projectile-fire(velocity,angle)##
##PRESET:projectile-vacuum(velocity,angle)##
```

**Examples:**
```
Projectile in air: ##PRESET:projectile-air(30,45)##
Projectile in water: ##PRESET:projectile-water(30,45)##
Projectile in fire: ##PRESET:projectile-fire(30,45)##
Projectile in vacuum: ##PRESET:projectile-vacuum(30,45)##
```

**Forces Shown:**
- **Air**: Weight, Drag (air resistance)
- **Water**: Weight, Drag (high), Buoyancy
- **Fire/Hot Gas**: Weight, Drag (medium), Thermal convection
- **Vacuum**: Weight only (parabolic path)

---

### Free Fall in Different Mediums

**Syntax:**
```
##PRESET:freefall-air(mass)##
##PRESET:freefall-water(mass)##
##PRESET:freefall-fire(mass)##
##PRESET:freefall-vacuum(mass)##
```

**Examples:**
```
Free fall in air: ##PRESET:freefall-air(5)##
Free fall in water: ##PRESET:freefall-water(5)##
Free fall in fire: ##PRESET:freefall-fire(5)##
Free fall in vacuum: ##PRESET:freefall-vacuum(5)##
```

**Forces Shown:**
- **Air**: Weight, Drag (terminal velocity)
- **Water**: Weight, Drag (high), Buoyancy (slow fall)
- **Fire/Hot Gas**: Weight, Drag, Thermal updraft
- **Vacuum**: Weight only (constant acceleration)

---

### Medium Comparison Diagram

**Syntax:**
```
##PRESET:medium-comparison(scenario)##
```

**Examples:**
```
##PRESET:medium-comparison(pendulum)##
##PRESET:medium-comparison(projectile)##
##PRESET:medium-comparison(freefall)##
```

Shows all four mediums side-by-side for direct comparison!

---

## Excel Usage Examples

### Example 1: Compare Two Pendulums
```
| Question Text |
|---------------|
| Compare pendulum in air ##PRESET:pendulum-air(100,30)## vs water ##PRESET:pendulum-water(100,30)##. Which has shorter period? |
```

### Example 2: Environment Options
```
| Option A | Option B | Option C | Option D |
|----------|----------|----------|----------|
| ##PRESET:pendulum-air(100,30)## | ##PRESET:pendulum-water(100,30)## | ##PRESET:pendulum-fire(100,30)## | ##PRESET:pendulum-vacuum(100,30)## |
```

### Example 3: Side-by-Side Comparison
```
| Question Text |
|---------------|
| Study the comparison: ##PRESET:medium-comparison(projectile)## Which medium gives maximum range? |
```

### Example 4: Multiple Scenarios
```
| Question Text |
|---------------|
| A ball falls in air ##PRESET:freefall-air(5)## and water ##PRESET:freefall-water(5)##. Calculate terminal velocities. |
```

---

## Use Cases

### 1. **Drag Force Comparison**
```
Compare drag in different mediums:
- Air: ##PRESET:projectile-air(30,45)##
- Water: ##PRESET:projectile-water(30,45)##
```

### 2. **Buoyancy Effects**
```
Show buoyancy in water:
##PRESET:freefall-water(5)##
vs no buoyancy in air:
##PRESET:freefall-air(5)##
```

### 3. **Terminal Velocity**
```
Different terminal velocities:
- Air: ##PRESET:freefall-air(10)##
- Water: ##PRESET:freefall-water(10)##
```

### 4. **Ideal vs Real Motion**
```
Ideal (vacuum): ##PRESET:projectile-vacuum(30,45)##
Real (air): ##PRESET:projectile-air(30,45)##
```

### 5. **Thermal Effects**
```
Hot gas effects:
##PRESET:pendulum-fire(100,30)##
##PRESET:freefall-fire(5)##
```

---

## Summary

**New Environment Presets: 13**
- 4 Pendulum variants (air, water, fire, vacuum)
- 4 Projectile variants (air, water, fire, vacuum)
- 4 Free fall variants (air, water, fire, vacuum)
- 1 Comparison diagram

**Total System: 354 presets** (including 13 environment variants)

Perfect for teaching:
- Drag force effects
- Buoyancy
- Terminal velocity
- Ideal vs real motion
- Medium resistance
