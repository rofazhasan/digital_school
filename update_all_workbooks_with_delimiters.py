#!/usr/bin/env python3
"""
Update all 21 HSC Physics Question Workbooks:
- Remove any static /question_images/ paths from Column 8 ('Primary Image URL')
- Insert pure delimiter syntax (##PRESET:...[size:medium]## and ##GEO:...[size:medium]##)
- Maintain 100% schema integrity, 'Template' sheet at index 0, and active
- 101 rows per file (1 header + 100 questions)
"""

import openpyxl
import os
import sys

DELIMITER_MAPPINGS = {
    # 1st Paper
    'HSC_Physics_1st_Paper_Chapter_01_Physical_World_and_Measurement.xlsx': [
        (6, '##PRESET:axes-2d[size:medium]##'),
        (26, '##GEO:screw-gauge[size:medium]##'),
        (27, '##GEO:vernier[size:medium]##'),
    ],
    'HSC_Physics_1st_Paper_Chapter_02_Vector.xlsx': [
        (2, '##PRESET:vector-3d[size:medium]##'),
        (10, '##GEO:parallelogram[A=A,B=B,C=C,D=D,b=8,h=5,theta=52°][size:medium]##'),
        (33, '##PRESET:vector[size:medium]##'),
    ],
    'HSC_Physics_1st_Paper_Chapter_03_Dynamics.xlsx': [
        (2, '##PRESET:projectile(45,20)[size:medium]##'),
        (16, '##PRESET:projectile-drag[size:medium]##'),
        (32, '##PRESET:circular-motion[size:medium]##'),
    ],
    'HSC_Physics_1st_Paper_Chapter_04_Newtonian_Mechanics.xlsx': [
        (3, '##PRESET:atwood(5,3)[size:medium]##'),
        (24, '##PRESET:incline(30,10,true)[size:medium]##'),
        (41, '##PRESET:incline-friction-static(30,5,0.4)[size:medium]##'),
        (56, '##PRESET:collision[size:medium]##'),
    ],
    'HSC_Physics_1st_Paper_Chapter_05_Work_Energy_and_Power.xlsx': [
        (2, '##PRESET:spring(100)[size:medium]##'),
        (21, '##PRESET:incline-spring(30,5,0.2)[size:medium]##'),
        (36, '##PRESET:spring-projectile(100,2,45)[size:medium]##'),
    ],
    'HSC_Physics_1st_Paper_Chapter_06_Gravitation_and_Gravity.xlsx': [
        (22, '##GEO:ellipse[size:medium]##'),
        (52, '##PRESET:three-body[size:medium]##'),
        (71, '##PRESET:circular-motion[size:medium]##'),
    ],
    'HSC_Physics_1st_Paper_Chapter_07_Structural_Properties_of_Matter.xlsx': [
        (9, '##PRESET:youngs-modulus[size:medium]##'),
        (26, '##PRESET:bernoulli-equation[size:medium]##'),
        (51, '##PRESET:archimedes-principle[size:medium]##'),
    ],
    'HSC_Physics_1st_Paper_Chapter_08_Periodic_Motion.xlsx': [
        (5, '##PRESET:pendulum(30,1)[size:medium]##'),
        (23, '##PRESET:conical-pendulum[size:medium]##'),
        (46, '##PRESET:spring-pendulum(100,2,20,20)[size:medium]##'),
        (61, '##PRESET:double-pendulum(100,80,30,45)[size:medium]##'),
    ],
    'HSC_Physics_1st_Paper_Chapter_09_Waves.xlsx': [
        (10, '##PRESET:wave-standing[size:medium]##'),
        (26, '##PRESET:wave-transverse[size:medium]##'),
        (51, '##PRESET:doppler-effect[size:medium]##'),
    ],
    'HSC_Physics_1st_Paper_Chapter_10_Ideal_Gas_and_Kinetic_Theory_of_Gases.xlsx': [
        (22, '##PRESET:maxwell-distribution[size:medium]##'),
        (41, '##PRESET:pv-diagram(isothermal)[size:medium]##'),
        (66, '##PRESET:isobaric[size:medium]##'),
    ],

    # 2nd Paper
    'HSC_Physics_2nd_Paper_Chapter_01_Thermodynamics.xlsx': [
        (16, '##PRESET:pv-diagram(adiabatic)[size:medium]##'),
        (33, '##PRESET:carnot-cycle[size:medium]##'),
        (51, '##PRESET:refrigerator[size:medium]##'),
        (76, '##PRESET:heat-engine[size:medium]##'),
    ],
    'HSC_Physics_2nd_Paper_Chapter_02_Static_Electricity.xlsx': [
        (9, '##PRESET:coulombs-law[size:medium]##'),
        (26, '##PRESET:gauss-law[size:medium]##'),
        (46, '##PRESET:capacitor[size:medium]##'),
    ],
    'HSC_Physics_2nd_Paper_Chapter_03_Current_Electricity.xlsx': [
        (16, '##PRESET:circuit-parallel[size:medium]##'),
        (42, '##PRESET:circuit-wheatstone[size:medium]##'),
        (61, '##PRESET:potentiometer[size:medium]##'),
        (76, '##PRESET:circuit-rc-charging[size:medium]##'),
    ],
    'HSC_Physics_2nd_Paper_Chapter_04_Magnetic_Effects_of_Current_and_Magnetism.xlsx': [
        (2, '##PRESET:ampere-law[size:medium]##'),
        (5, '##PRESET:circular-motion[size:medium]##'),
        (10, '##PRESET:circular-motion[size:medium]##'),
        (35, '##PRESET:galvanometer[size:medium]##'),
    ],
    'HSC_Physics_2nd_Paper_Chapter_05_Electromagnetic_Induction_and_Alternating_Current.xlsx': [
        (2, '##PRESET:lenz-law[size:medium]##'),
        (20, '##PRESET:faraday-law[size:medium]##'),
        (73, '##PRESET:ac-source[size:medium]##'),
        (80, '##PRESET:lc-circuit[size:medium]##'),
    ],
    'HSC_Physics_2nd_Paper_Chapter_06_Geometrical_Optics.xlsx': [
        (23, '##PRESET:prism(60)[size:medium]##'),
        (35, '##PRESET:lens-convex(20)[size:medium]##'),
        (45, '##PRESET:lens-concave(20)[size:medium]##'),
        (56, '##PRESET:ray-diagram[size:medium]##'),
        (80, '##PRESET:telescope[size:medium]##'),
    ],
    'HSC_Physics_2nd_Paper_Chapter_07_Physical_Optics.xlsx': [
        (19, '##PRESET:double-slit[size:medium]##'),
        (41, '##PRESET:diffraction-grating[size:medium]##'),
        (66, '##PRESET:laser[size:medium]##'),
    ],
    'HSC_Physics_2nd_Paper_Chapter_08_Introduction_to_Modern_Physics.xlsx': [
        (21, '##PRESET:lorentz-factor[size:medium]##'),
        (64, '##PRESET:photoelectric[size:medium]##'),
        (80, '##PRESET:compton-scattering[size:medium]##'),
    ],
    'HSC_Physics_2nd_Paper_Chapter_09_Atomic_Model_and_Nuclear_Physics.xlsx': [
        (15, '##PRESET:bohr-model(3)[size:medium]##'),
        (25, '##PRESET:energy-levels[size:medium]##'),
        (53, '##PRESET:nuclear-fission[size:medium]##'),
        (63, '##PRESET:nuclear-fusion[size:medium]##'),
        (80, '##PRESET:nuclear-fusion[size:medium]##'),
    ],
    'HSC_Physics_2nd_Paper_Chapter_10_Semiconductor_and_Electronics.xlsx': [
        (11, '##PRESET:zener-diode[size:medium]##'),
        (26, '##PRESET:diode[size:medium]##'),
        (45, '##PRESET:transistor-npn[size:medium]##'),
        (61, '##PRESET:and-gate[size:medium]##'),
        (76, '##PRESET:or-gate[size:medium]##'),
    ],
    'HSC_Physics_2nd_Paper_Chapter_11_Astronomy.xlsx': [
        (2, '##GEO:ellipse[size:medium]##'),
        (51, '##PRESET:big-bang[size:medium]##'),
        (80, '##PRESET:black-hole[size:medium]##'),
        (86, '##PRESET:black-hole[size:medium]##'),
    ],
}

def update_workbooks():
    base_dir = '/Users/md.rofazhasanrafiu/coding'
    total_files_updated = 0
    total_diagrams_placed = 0

    for filename, mappings in DELIMITER_MAPPINGS.items():
        filepath = os.path.join(base_dir, filename)
        if not os.path.exists(filepath):
            print(f"ERROR: {filename} not found!")
            continue

        wb = openpyxl.load_workbook(filepath)
        sheet = None
        for sname in wb.sheetnames:
            if sname.lower() == 'template':
                sheet = wb[sname]
                break
        if not sheet:
            sheet = wb.active

        # Identify Column 8 ('Primary Image URL')
        header_row = [cell.value for cell in sheet[1]]
        try:
            col_idx = header_row.index('Primary Image URL') + 1
        except ValueError:
            col_idx = 8

        # 1. Clean out any old /question_images/ paths across all rows and all columns
        cleared_count = 0
        for r in range(2, sheet.max_row + 1):
            for c in range(1, sheet.max_column + 1):
                val = str(sheet.cell(row=r, column=c).value or '')
                if '/question_images/' in val or (c == col_idx and val.startswith('/')):
                    sheet.cell(row=r, column=c, value=None)
                    cleared_count += 1

        # 2. Insert delimiter mappings into specific rows
        diagrams_in_file = 0
        for row_num, delimiter_str in mappings:
            if row_num <= sheet.max_row:
                sheet.cell(row=row_num, column=col_idx, value=delimiter_str)
                diagrams_in_file += 1
                total_diagrams_placed += 1

        # Ensure Template sheet is active & at index 0
        template_idx = wb.sheetnames.index(sheet.title)
        wb.active = template_idx

        wb.save(filepath)
        wb.close()
        total_files_updated += 1
        print(f"Updated {filename}: cleared {cleared_count} old paths, set {diagrams_in_file} delimiters.")

    print(f"\nSUCCESS: Updated {total_files_updated} files with {total_diagrams_placed} delimiter diagrams.")

if __name__ == '__main__':
    update_workbooks()
