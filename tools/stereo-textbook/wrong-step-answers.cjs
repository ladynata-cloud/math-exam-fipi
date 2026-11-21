'use strict';

const assert = require('node:assert/strict');

// Numerical mistakes linked to the actual diagram or unit choice at each step.
const misconceptions = new Map([
  ['ex-main-0586/step-1', '1/3'],
  ['ex-main-0586/step-2', '3'],
  ['ex-main-0586/step-3', '1'],
  ['ex-main-0586/step-4', '-10'],
  ['ex-main-0587/step-1', '3'],
  ['ex-main-0587/step-2', '1'],
  ['ex-main-0587/step-3', '3'],
  ['ex-main-0587/step-4', '7'],
  ['ex-main-0588-a/step-1', '1.5'],
  ['ex-main-0588-a/step-2', '4.5'],
  ['ex-main-0588-a/step-3', '1'],
  ['ex-main-0588-a/step-4', '7'],
  ['ex-main-0588-b/step-1', '3'],
  ['ex-main-0588-b/step-2', '1'],
  ['ex-main-0588-b/step-3', '1'],
  ['ex-main-0588-b/step-4', '1'],
  ['ex-main-0588-c/step-1', '1.5'],
  ['ex-main-0588-c/step-2', '-0.5'],
  ['ex-main-0588-c/step-3', '3'],
  ['ex-main-0588-c/step-4', '-2'],
  ['ex-main-0588-d/step-1', '2'],
  ['ex-main-0588-d/step-2', '2'],
  ['ex-main-0588-d/step-3', '1'],
  ['ex-main-0588-d/step-4', '-1'],
  ['ex-main-0589/step-1', '0'],
  ['ex-main-0589/step-2', '0'],
  ['ex-main-0589/step-3', '2'],
  ['ex-main-0589/step-4', '2'],
  ['ex-main-0590/step-1', '1'],
  ['ex-main-0590/step-2', '5'],
  ['ex-main-0590/step-3', '5'],
  ['ex-main-0590/step-4', '-1'],
  ['ex-main-0591-a/step-1', '0'],
  ['ex-main-0591-a/step-2', '1'],
  ['ex-main-0591-a/step-3', '1'],
  ['ex-main-0591-a/step-4', '2'],
  ['ex-main-0591-b/step-1', '3'],
  ['ex-main-0591-b/step-2', '3'],
  ['ex-main-0591-b/step-3', '5'],
  ['ex-main-0591-b/step-4', '3'],
  ['ex-main-0582-a/step-1', 'AC'],
  ['ex-main-0582-a/step-2', '0.5'],
  ['ex-main-0582-a/step-3', '2'],
  ['ex-main-0582-a/step-4', '-8'],
  ['ex-main-0582-b/step-1', 'AE'],
  ['ex-main-0582-b/step-2', 'BA'],
  ['ex-main-0582-b/step-3', '0.5'],
  ['ex-main-0582-b/step-4', '28'],
  ['ex-main-0583/step-1', 'MN'],
  ['ex-main-0583/step-2', '2'],
  ['ex-main-0583/step-3', '0.5'],
  ['ex-main-0583/step-4', '2'],
  ['ex-main-0584-a/step-1', '-3'],
  ['ex-main-0584-a/step-2', '-10'],
  ['ex-main-0584-a/step-3', '-1'],
  ['ex-main-0584-a/step-4', '-19'],
  ['ex-main-0584-b/step-1', '-6'],
  ['ex-main-0584-b/step-2', '-14'],
  ['ex-main-0584-b/step-3', '8'],
  ['ex-main-0584-b/step-4', '5'],
  ['ex-main-0585/step-1', 'C1C'],
  ['ex-main-0585/step-2', '2'],
  ['ex-main-0585/step-3', 'DA'],
  ['ex-main-0585/step-4', '7'],
  ['ex-main-0423/step-2', '4*sqrt(10)'], // Apothem of the other face.
  ['ex-main-0423/step-3', '3*sqrt(17)'],
  ['ex-main-0430-b/step-4', '5/4'], // Centre on the opposite side of the base plane.
  ['ex-main-0433/step-2', 'sqrt(33)/6'], // Half the height in place of the inradius.
  ['ex-main-0433/step-3', '4*sqrt(33)/11'], // Omitted factor 2 in the denominator.
  ['ex-main-0434/step-4', '2*sqrt(2)'], // Half-side in place of the side.
  ['ex-main-0436-a/step-4', '2/sqrt(3)'], // Reversed ratio of the legs.
  ['ex-main-0436-b/step-4', '6*sqrt(3)'],
  ['ex-main-0444/step-4', '3900'], // Grams instead of kilograms.
  ['theory-053/step-2', '1440'], // Counted the small cubes without converting their volume.
  ['ex-main-0456-d/step-4', '45'], // Central angle before drawing its bisector.
  ['ex-main-0461/step-4', '8500'], // Kilograms in the field asking for tonnes.
  ['ex-main-0463/step-4', '2.25'], // Outer cross-section without subtracting the hole.
  ['ex-main-0466/step-2', '2/3'], // Side before squaring.
  ['ex-main-0467/step-2', '1/2'], // Radius in the area field.
  ['ex-main-0468/step-1', '1/2'], // Height in place of horizontal radius.
  ['ex-main-0468/step-2', '1/4'], // Radius before squaring it.
  ['ex-main-0468/step-3', '1/3'], // Integrating the radius instead of its square.
  ['ex-main-0469/step-1', '6'], // Half of the base instead of its altitude.
  ['ex-main-0469/step-2', '96'], // Omitting the triangle area factor.
  ['ex-main-0470/step-3', '5'], // Side length in the height field.
  ['ex-main-0471/step-1', '27'], // Squared median before taking two thirds.
  ['ex-main-0472/step-2', '25'], // Diameter instead of radius.
  ['ex-main-0472/step-3', '168'], // Area of the enclosing rectangle.
  ['theory-056/step-2', '2'], // Area without multiplying by layer thickness.
  ['theory-057/step-3', '6'], // Area in the volume field.
  ['theory-058/step-2', '1/2'], // Length ratio before squaring.
  ['theory-058/step-3', '24'], // Volume of the corresponding prism.
  ['theory-059/step-2', '1/2'], // Radius ratio in place of the area ratio.
  ['theory-059/step-3', '16'], // Volume coefficient for a full cylinder.
  ['ex-main-0477-a/step-3', '18'], // Prism volume.
  ['ex-main-0477-b/step-1', '13.5'], // Full sloping side rather than its projection.
  ['ex-main-0477-b/step-2', '135'], // Omitting the triangular factor.
  ['ex-main-0477-b/step-3', '2.2'], // Metres in a centimetre field.
  ['ex-main-0479-a/step-2', '36'], // Circumradius squared rather than side squared.
  ['ex-main-0479-b/step-1', '3'], // Half the edge from a bisected face.
  ['ex-main-0479-c/step-1', '60'], // Full apex angle.
  ['ex-main-0480/step-3', '54'], // Prism in place of pyramid.
  ['ex-main-0481-a/step-2', '6'], // Square inradius in the side field.
  ['ex-main-0481-b/step-2', '9'], // Squared inradius rather than circumradius.
  ['ex-main-0482/step-2', '64'], // Squared radius.
  ['ex-main-0483/step-1', '9'], // Squared inradius in place of circumradius.
  ['ex-main-0483/step-2', '160'], // Inradius used in the vertical triangle.
  ['ex-main-0483/step-3', '6*sqrt(498)'], // Lateral area in the volume field.
  ['ex-main-0483/step-4', '6*sqrt(471)'], // Volume in the lateral-area field.
  ['ex-main-0484/step-2', '10/3'], // Inradius of triangular base.
  ['ex-main-0485/step-2', '15/2'], // Full hypotenuse used for the projection.
  ['ex-main-0486/step-1', '4'], // Missing the bottom face.
  ['ex-main-0487/step-2', '36'], // Full perimeter.
  ['ex-main-0488-a/step-1', '6'], // Opposite leg instead of adjacent leg.
  ['ex-main-0488-b/step-3', '128'], // Base altitude used for the spatial height.
  ['ex-main-0488-c/step-3', '60'], // Volume of the encompassing box.
  ['ex-main-0489/step-2', '21'], // Common edge instead of its perpendicular.
  ['ex-main-0490/step-2', '144'], // Slanted face height in place of vertical height.
  ['ex-main-0490/step-3', '5/4'], // Omitted geometric mean of base areas.
  ['ex-main-0491/step-1', '6'], // Unhalved hypotenuse difference.
  ['ex-main-0491/step-3', '29'], // Missing geometric mean.
  ['ex-main-0492/step-1', '15'], // Horizontal circumradius in height field.
  ['ex-main-0492/step-3', '180'], // Removed tip in place of remaining frustum.
  ['ex-main-0493/step-2', '9'], // Height computed with side lengths, not diagonals.
  ['ex-main-0494-a/step-1', '3'], // Diameter instead of squared radius.
  ['ex-main-0494-b/step-3', '3'], // Forgot the factor three when recovering height.
  ['ex-main-0494-c/step-2', '16'], // Returned squared radius.
  ['ex-main-0495/step-1', '3/5'], // Distance from the lower base.
  ['ex-main-0495/step-2', '4/25'], // Area ratio instead of volume ratio.
  ['ex-main-0495/step-3', '192/125'], // Multiplied known small volume by its fraction.
  ['ex-main-0496/step-3', '15'], // Slant height used in the volume.
  ['ex-main-0497/step-2', '100'], // Squared the diameter.
  ['ex-main-0498/step-3', '240'], // Swapped radius and height in the narrow cone.
  ['ex-main-0498/step-4', '100'], // Swapped radius and height in the wide cone.
  ['ex-main-0499/step-2', '9'], // Used the base radius as the net radius.
  ['ex-main-0499/step-3', '144'], // Used the complementary sector.
  ['ex-main-0500/step-1', '1/6'], // Reversed the radius ratio.
  ['ex-main-0500/step-2', '15/2'], // Treated the full area as lateral area.
  ['ex-main-0501/step-1', '9'], // Added radii instead of subtracting.
  ['ex-main-0501/step-3', '60'], // Omitted the mixed radius product.
  ['ex-main-0502/step-3', '18'], // Used radii, not diameters, as trapezoid bases.
  ['ex-main-0502/step-4', '60'], // Forgot the mixed product.
  ['theory-060/step-3', '18'], // Integrated half the ball.
  ['theory-061-a/step-1', '1'], // Used the cap height as the lower coordinate.
  ['theory-061-b/step-3', '12'], // Added the overlapping caps.
  ['theory-061-c/step-3', '8/3'], // Omitted the cone below the cap.
  ['theory-062/step-3', '4'], // Used one central disk as the surface.
  ['ex-main-0503-a/step-2', '16*pi'], // Central disk instead of the sphere.
  ['ex-main-0503-a/step-3', '256*pi'], // Omitted the factor one third.
  ['ex-main-0503-b/step-2', '9'], // Square root of the cubic radius.
  ['ex-main-0503-c/step-3', '64*pi'], // Repeated the area instead of the volume.
  ['ex-main-0504/step-3', '16'], // Squared the diameter ratio.
  ['ex-main-0505/step-3', '12'], // Used three times the cylinder height.
  ['ex-main-0506/step-2', '125/3'], // Counted both portions as full balls.
  ['ex-main-0507/step-3', '8/75'], // Counted just one ball.
  ['ex-main-0508/step-2', '5'], // Confused the base and sphere radii.
  ['ex-main-0509/step-3', '5/32'], // Counted a single cap.
  ['ex-main-0510/step-2', '45'], // Used the centre-to-plane distance without calculating the cap.
  ['ex-main-0510/step-3', '58500'], // Repeated the small cap instead of its complement.
  ['ex-main-0511/step-4', '52/3'], // Did not divide by the model radius cubed.
  ['ex-main-0512/step-1', '18'], // Used the diameter as the radius.
  ['ex-main-0513/step-2', '45'], // Used the cone height.
  ['ex-main-0514/step-3', 'sqrt(3)/3'], // Used the axial projection in place of cap height.
  ['ex-main-0515/step-1', '3/4'], // Returned the water fraction.
  ['ex-main-0516/step-3', '32'], // Counted only the seam allowance.
  ['ex-main-0517/step-3', '2'], // Computed lateral surface alone.
  ['ex-selfcheck-v-01-a/step-3', '12'], // Counted the full body instead of its difference.
  ['ex-selfcheck-v-02/step-3', '1/8'], // Scaled the equal height as well.
  ['ex-selfcheck-v-03/step-3', '1/2'], // Treated circular area as linear in diameter.
  ['ex-selfcheck-v-04/step-2', '1/4'], // Omitted the doubled height.
  ['ex-selfcheck-v-05/step-2', '4'], // Used the side as a perpendicular height.
  ['ex-selfcheck-v-06/step-2', '8'], // Scaled all three dimensions when heights are equal.
  ['ex-selfcheck-v-07/step-3', '4'], // Used the entire excess for a single cone.
  ['ex-selfcheck-v-08/step-3', '1'], // Assumed swapping a radius with a height preserves volume.
  ['ex-selfcheck-v-09-b/step-2', '1/4'], // Computed areas, not volumes.
  ['ex-selfcheck-v-10/step-2', '3'], // Divided radii only.
  ['ex-selfcheck-v-11/step-3', 'sqrt(3)'], // Returned the radius ratio.
  ['ex-selfcheck-v-12-a/step-2', '1/8'], // Cubed the radius ratio.
  ['ex-selfcheck-v-12-b/step-2', '324'], // Scaled the area by the volume ratio.
  ['ex-selfcheck-v-13/step-2', '8'], // Left the given volume ratio unchanged.
  ['ex-selfcheck-v-14/step-2', '9/4'], // Left the given surface ratio unchanged.
  ['ex-main-0518/step-3', '1296'], // Product of the three face areas is the squared volume.
  ['ex-main-0519/step-1', '194'], // Counted every squared edge twice.
  ['ex-main-0519/step-3', '16*sqrt(11)'], // Failed to simplify the radical product.
  ['ex-main-0520/step-2', '2'], // Subtracted lengths instead of squared lengths.
  ['ex-main-0521/step-2', '109'], // Selected the longer diagonal.
  ['ex-main-0522/step-3', '28'], // Returned the difference of squared diagonals.
  ['ex-main-0522/step-4', '176'], // Used the squared base area.
  ['ex-main-0523/step-2', '16'], // Treated the common leg as the hypotenuse.
  ['ex-main-0524/step-2', '3'], // Confused shortest base leg with the side face area.
  ['ex-main-0525/step-3', '2*sqrt(2)'], // Gave the height alone.
  ['ex-main-0525/step-4', '4*sqrt(6)'], // Scaled volume linearly.
  ['ex-main-0526/step-3', '24'], // Kept the completed parallelepiped.
  ['ex-main-0527/step-2', '24'], // Missed the half in the triangle base.
  ['ex-main-0528/step-2', '5.1'], // Confused a face area with a section length.
  ['ex-main-0528/step-3', '10.8'], // Returned semiperimeter instead of area.
  ['ex-main-0528/step-4', '12.24'], // Forgot the edge length.
  ['ex-main-0528/step-5', '6.12'], // Used the old edge length.
  ['ex-main-0529/step-2', '27'], // Used the complete altitude of the triangular base.
  ['ex-main-0530/step-1', '1'], // Confused the midpoint distance with the vertex height.
  ['ex-main-0531/step-3', '2*sqrt(2)'], // Substituted a lateral edge for the base radius.
  ['ex-main-0532/step-3', '2'], // Used a triangle instead of the entire square.
  ['ex-main-0532/step-4', '4*sqrt(2)'], // Omitted division by three.
  ['ex-main-0532/step-5', '4*sqrt(2)/3'], // Kept a square after changing the base.
  ['ex-main-0533/step-3', '2*sqrt(3)'], // Forgot one half in the area formula.
  ['ex-main-0533/step-4', '2*sqrt(3)'], // Calculated the corresponding prism volume.
  ['ex-main-0533/step-5', '2*sqrt(3)/3'], // Reused the preceding obtuse base.
  ['ex-main-0534/step-1', '2'], // Submitted the half-diagonal.
  ['ex-main-0534/step-3', '12*sqrt(3)'], // Forgot one half in the area.
  ['ex-main-0534/step-4', '12*sqrt(3)'], // Omitted division by three.
  ['ex-main-0536-a/step-4', 'sqrt(23)/2'], // Used the prism product.
  ['ex-main-0536-a/step-5', 'sqrt(23)/6'], // Reused the preceding data.
  ['ex-main-0536-b/step-3', '2*sqrt(3)'], // Used the area of the bounding rectangle.
  ['ex-main-0535/step-1', '4'], // Replaced a rhombus altitude with its side.
  ['ex-main-0536-a/step-2', '1/3'], // Lost the factor two in the cross term.
  ['ex-main-0536-a/step-3', '2'], // Submitted the oblique segment squared.
  ['ex-main-0536-b/step-1', '8'], // Used full edges for both horizontal offsets.
  ['ex-main-0536-b/step-4', 'sqrt(3)/3'], // Counted only half of the tetrahedron.
  ['ex-main-0537/step-2', '27'], // Cubed a height difference.
  ['ex-main-0537/step-4', '31/73'], // Reused the initial sides after transfer.
  ['ex-main-0538-a/step-1', '9'], // Submitted the square of the radius.
  ['ex-main-0538-a/step-4', '36'], // Used the preceding base.
  ['ex-main-0538-b/step-1', '4'], // Treated the side of the axial square as a radius.
  ['ex-main-0538-c/step-1', '6'], // Omitted the two base disks.
  ['ex-main-0539/step-1', '9'], // Scaled the height with the radius.
  ['ex-main-0539/step-2', '4/9'], // Compared base areas without compensating heights.
  ['ex-main-0540/step-1', '0.5625'], // Halved a given radius.
  ['ex-main-0540/step-2', '6.75'], // Computed the cylinder volume.
  ['ex-main-0540/step-3', '7069'], // Used full precision after the prompt set pi to 3.14.
  ['ex-main-0540/step-4', '7065'], // Kept the original radius.
  ['ex-main-0541/step-1', '4'], // Used the entire long side.
  ['ex-main-0541/step-3', '10'], // Replaced the cone by a cylinder.
  ['ex-main-0542/step-2', '2'], // Submitted the complete incircle diameter.
  ['ex-main-0542/step-3', '4/3'], // Used the diameter as the radius.
  ['ex-main-0543/step-1', '3'], // Used the sphere radius as the cylinder height.
  ['ex-main-0543/step-3', '2/3'], // Reversed the source ratio.
  ['ex-main-0543/step-4', '3/2'], // Retained the previous numerator.
  ['ex-main-0544/step-2', '10'], // Submitted the slant height.
  ['ex-main-0544/step-3', '24'], // Used the small sphere radius in the cone.
  ['ex-main-0545/step-2', '3'], // Used the base radius as the contact radius.
  ['ex-main-0545/step-3', '6/5'], // Omitted the factor two in the circumference.
  ['ex-main-0546/step-1', '3'], // Submitted the slant projection.
  ['ex-main-0546/step-3', '8/21'], // Reversed the volume ratio.
  ['ex-main-0547/step-1', '1/2'], // Multiplied by the tangent instead of dividing.
  ['ex-main-0547/step-3', '32*sqrt(3)'], // Used a prism instead of a pyramid.
  ['ex-main-0547/step-4', '32*sqrt(3)/3'], // Kept the original volume.
  ['ex-main-0548/step-1', '2'], // Submitted the rhombus altitude.
  ['ex-main-0548/step-2', '4/3'], // Used the entire base dihedral angle.
  ['ex-main-0549/step-1', '8'], // Used the diameter.
  ['ex-main-0549/step-3', '24'], // Used the radius in the first power.
  ['ex-main-0550/step-1', '36'], // Selected the horizontal bisector for the key diagram.
  ['ex-main-0550/step-2', '288'], // Used the second admissible case instead of the key.
  ['ex-main-0550/step-3', '2*sqrt(3)'], // Kept the tall case after rotating the bisector.
  ['ex-main-0550/step-4', '32*sqrt(3)'], // Reused the tall-cylinder volume.
  ['ex-main-0551/step-1', '1'], // Removed the sign of a coordinate below the base.
  ['ex-main-0551/step-4', '100'], // Gave a surface area coefficient instead of a volume.
  ['ex-main-0552/step-2', '1'], // Used the base circumradius for the sphere.
  ['ex-main-0553/step-2', '5'], // Submitted half the rectangle diagonal.
  ['ex-main-0554/step-1', '1.5'], // Confused the rim radius with the cap sphere radius.
  ['ex-main-0554/step-3', '7.56'], // Included both end caps in the requested generator length.
  ['ex-main-0555/step-3', 'sqrt(5)'], // Counted the lateral surface only.
  ['ex-main-0555/step-4', 'pi'], // Submitted the cube face area.
  ['ex-main-0556-a/step-1', '4.6'], // Removed the wall thickness twice from the radius.
  ['ex-main-0556-a/step-2', '0.884736'], // Submitted the cavity fraction.
  ['ex-main-0556-a/step-3', '8.9'], // Used the density of solid copper.
  ['ex-main-0556-a/step-4', '1.026'], // Kept the older wall thickness.
  ['ex-main-0556-b/step-1', '3.5'], // Read millimetres as centimetres.
  ['ex-main-0556-b/step-2', '0.912673'], // Used the air fraction.
  ['ex-main-0556-b/step-3', '8.9'], // Used the material density for the shell.
  ['ex-main-0556-b/step-4', '0.777'], // Reused the preceding diameter ratio.
  ['theory-063/step-2', '-5'], // Gave a signed displacement as a length.
  ['theory-064/step-1', '3'], // Submitted an offset instead of the destination.
  ['ex-main-0557-a/step-2', '2'], // Selected the wrong opposite side.
  ['ex-main-0557-a/step-3', '2'], // Halved BC instead of BD.
  ['ex-main-0557-b/step-1', '-4'], // Reversed the sign of a length.
  ['ex-main-0557-b/step-3', '5'], // Used the full third side.
  ['ex-main-0557-b/step-4', '7'], // Forgot the midpoint on the new edge.
  ['ex-main-0558-a/step-2', '9'], // Confused two horizontal directions.
  ['ex-main-0558-b/step-1', '17'], // Used a space diagonal for a face.
  ['ex-main-0558-b/step-2', 'sqrt(145)'], // Gave the length where its square was requested.
  ['ex-main-0558-b/step-3', '15'], // Reused a side face diagonal.
  ['ex-main-0559-a/step-1', 'B1C1'],
  ['ex-main-0559-a/step-2', 'AD'],
  ['ex-main-0559-a/step-3', 'MC'],
  ['ex-main-0559-a/step-4', '12'],
  ['ex-main-0559-b/step-1', 'C1C'],
  ['ex-main-0559-b/step-2', 'BA'],
  ['ex-main-0559-b/step-3', '1'],
  ['ex-main-0559-b/step-4', '3'],
  ['ex-main-0559-c/step-1', 'MB1'],
  ['ex-main-0559-c/step-2', 'BC'],
  ['ex-main-0559-c/step-3', 'MC'],
  ['ex-main-0559-c/step-4', '8'],
  ['ex-main-0560-a/step-1', 'PQ'],
  ['ex-main-0560-a/step-2', 'NP'],
  ['ex-main-0560-a/step-3', 'PD'],
  ['ex-main-0560-a/step-4', '3'],
  ['ex-main-0560-b/step-1', '8'],
  ['ex-main-0560-b/step-2', '32'],
  ['ex-main-0560-b/step-3', '60'],
  ['ex-main-0560-b/step-4', '100'],
  ['ex-main-0562-a/step-1', '6'],
  ['ex-main-0562-b/step-1', '1'],
  ['ex-main-0562-c/step-2', 'AB'],
  ['ex-main-0563-a/step-1', 'нижнем'],
  ['ex-main-0563-a/step-2', 'D'],
  ['ex-main-0563-a/step-3', 'C'],
  ['ex-main-0563-a/step-4', '14'],
  ['ex-main-0563-b/step-1', 'K'],
  ['ex-main-0563-b/step-3', 'M'],
  ['ex-main-0563-b/step-4', '7'],
  ['ex-main-0563-c/step-3', 'C'],
  ['ex-main-0563-c/step-4', '17'],
  ['ex-main-0563-d/step-1', 'выходит'],
  ['ex-main-0563-d/step-3', 'C1'],
  ['ex-main-0563-d/step-4', '22'],
  ['ex-main-0563-e/step-1', '8'],
  ['ex-main-0563-e/step-2', 'вершины'],
  ['ex-main-0563-e/step-3', 'C1'],
  ['ex-main-0563-e/step-4', '10'],
  ['theory-065/step-1', 'BC'],
  ['theory-065/step-2', '7'],
  ['theory-065/step-3', 'BD'],
  ['theory-065/step-4', '17'],
  ['theory-066/step-1', '7'],
  ['theory-066/step-2', '19'],
  ['theory-066/step-3', '38'],
  ['theory-066/step-4', '38'],
  ['theory-067/step-1', '8'],
  ['theory-067/step-2', '1.5'],
  ['theory-067/step-3', '2'],
  ['theory-067/step-4', '-6'],
  ['ex-main-0564-a/step-1', 'A'],
  ['ex-main-0564-a/step-2', 'CB'],
  ['ex-main-0564-a/step-3', 'CA'],
  ['ex-main-0564-a/step-4', '7'],
  ['ex-main-0564-b/step-1', 'A'],
  ['ex-main-0564-b/step-2', 'C'],
  ['ex-main-0564-b/step-3', 'CA1'],
  ['ex-main-0564-b/step-4', '11'],
  ['ex-main-0564-c/step-1', 'B'],
  ['ex-main-0564-c/step-2', 'B1'],
  ['ex-main-0564-c/step-3', 'BC1'],
  ['ex-main-0564-c/step-4', '17'],
  ['ex-main-0564-d/step-1', 'D'],
  ['ex-main-0564-d/step-2', 'B1D1'],
  ['ex-main-0564-d/step-3', 'B1D'],
  ['ex-main-0564-d/step-4', '17'],
  ['ex-main-0564-e/step-1', 'B'],
  ['ex-main-0564-e/step-2', 'C1B1'],
  ['ex-main-0564-e/step-3', 'C1D'],
  ['ex-main-0564-e/step-4', '23'],
  ['ex-main-0565-a/step-1', 'DA'],
  ['ex-main-0565-a/step-2', 'DA'],
  ['ex-main-0565-a/step-3', 'да'],
  ['ex-main-0565-a/step-4', 'AD'],
  ['ex-main-0565-b/step-1', 'CA'],
  ['ex-main-0565-b/step-2', 'CA'],
  ['ex-main-0565-b/step-3', 'да'],
  ['ex-main-0565-b/step-4', 'AC'],
  ['ex-main-0565-c/step-1', 'CB'],
  ['ex-main-0565-c/step-2', 'CB'],
  ['ex-main-0565-c/step-3', 'да'],
  ['ex-main-0565-c/step-4', 'BC'],
  ['ex-main-0566-a/step-1', 'CB'],
  ['ex-main-0566-a/step-2', 'DA'],
  ['ex-main-0566-a/step-3', '2'],
  ['ex-main-0566-a/step-4', '-7'],
  ['ex-main-0566-b/step-1', 'B1A'],
  ['ex-main-0566-b/step-2', 'C1D'],
  ['ex-main-0566-b/step-3', '0'],
  ['ex-main-0566-b/step-4', '2'],
  ['ex-main-0566-c/step-1', 'DC'],
  ['ex-main-0566-c/step-2', 'AB'],
  ['ex-main-0566-c/step-3', '2'],
  ['ex-main-0566-c/step-4', '8'],
  ['ex-main-0566-d/step-1', 'A1B1'],
  ['ex-main-0566-d/step-2', 'AB'],
  ['ex-main-0566-d/step-3', '2'],
  ['ex-main-0566-d/step-4', 'B1A1'],
  ['ex-main-0567-a/step-1', 'BA1'],
  ['ex-main-0567-a/step-2', 'AB'],
  ['ex-main-0567-a/step-3', 'AA1'],
  ['ex-main-0567-a/step-4', '12'],
  ['ex-main-0567-b/step-1', 'AD'],
  ['ex-main-0567-b/step-2', 'DC'],
  ['ex-main-0567-b/step-3', 'AC'],
  ['ex-main-0567-b/step-4', '21'],
  ['ex-main-0567-c/step-1', 'C1D1'],
  ['ex-main-0567-c/step-2', 'A'],
  ['ex-main-0567-c/step-3', 'A1A'],
  ['ex-main-0567-c/step-4', '18'],
  ['ex-main-0567-d/step-1', 'BA1'],
  ['ex-main-0567-d/step-2', 'CB'],
  ['ex-main-0567-d/step-3', 'CA1'],
  ['ex-main-0567-d/step-4', '19'],
  ['ex-main-0567-e/step-1', 'C1D1'],
  ['ex-main-0567-e/step-2', 'CD'],
  ['ex-main-0567-e/step-3', 'CA'],
  ['ex-main-0567-e/step-4', '17'],
  ['ex-main-0568-a/step-1', 'BA'],
  ['ex-main-0568-a/step-2', 'CD'],
  ['ex-main-0568-a/step-3', 'нет'],
  ['ex-main-0568-a/step-4', 'нет'],
  ['ex-main-0568-b/step-1', 'BC'],
  ['ex-main-0568-b/step-2', 'AD'],
  ['ex-main-0568-b/step-3', 'да'],
  ['ex-main-0568-b/step-4', '1'],
  ['ex-main-0569/step-1', 'DA'],
  ['ex-main-0569/step-2', 'DA-DB1'],
  ['ex-main-0569/step-3', 'AD-AK'],
  ['ex-main-0569/step-4', 'DM'],
  ['ex-main-0570-a/step-1', '1'],
  ['ex-main-0570-a/step-2', 'CA'],
  ['ex-main-0570-a/step-3', '1'],
  ['ex-main-0570-a/step-4', 'BA'],
  ['ex-main-0570-b/step-1', 'BC'],
  ['ex-main-0570-b/step-2', 'C'],
  ['ex-main-0570-b/step-3', 'BD'],
  ['ex-main-0570-b/step-4', '1'],
  ['ex-main-0571-a/step-1', '7'],
  ['ex-main-0571-a/step-2', '17'],
  ['ex-main-0571-a/step-3', '-13'],
  ['ex-main-0571-a/step-4', '23'],
  ['ex-main-0571-b/step-1', 'NK1'],
  ['ex-main-0571-b/step-2', 'L1M'],
  ['ex-main-0571-b/step-3', 'да'],
  ['ex-main-0571-b/step-4', '21'],
  ['ex-main-0571-c/step-1', 'M1N'],
  ['ex-main-0571-c/step-2', 'LK1'],
  ['ex-main-0571-c/step-3', 'sqrt(153)'],
  ['ex-main-0571-c/step-4', '31'],
  ['ex-main-0572-a/step-1', '1'],
  ['ex-main-0572-a/step-2', 'CA'],
  ['ex-main-0572-a/step-3', 'QP'],
  ['ex-main-0572-a/step-4', '1'],
  ['ex-main-0572-b/step-1', '1'],
  ['ex-main-0572-b/step-2', 'QA'],
  ['ex-main-0572-b/step-3', 'KA'],
  ['ex-main-0572-b/step-4', 'AK'],
  ['ex-main-0572-c/step-1', '1'],
  ['ex-main-0572-c/step-2', 'KC'],
  ['ex-main-0572-c/step-3', 'PC'],
  ['ex-main-0572-c/step-4', 'CP'],
  ['ex-main-0572-d/step-1', 'AB'],
  ['ex-main-0572-d/step-2', 'CD'],
  ['ex-main-0572-d/step-3', '6'],
  ['ex-main-0572-d/step-4', 'BA'],
  ['ex-main-0573-a/step-1', '1'],
  ['ex-main-0573-a/step-2', 'BD'],
  ['ex-main-0573-a/step-3', 'BA'],
  ['ex-main-0573-a/step-4', 'нет'],
  ['ex-main-0573-b/step-1', '1'],
  ['ex-main-0573-b/step-2', 'CD'],
  ['ex-main-0573-b/step-3', 'BA'],
  ['ex-main-0573-b/step-4', 'нет'],
  ['ex-main-0573-c/step-1', '1'],
  ['ex-main-0573-c/step-2', 'CD'],
  ['ex-main-0573-c/step-3', 'BA'],
  ['ex-main-0573-c/step-4', 'нет'],
  ['ex-main-0574-a/step-1', 'EO'],
  ['ex-main-0574-a/step-2', 'DA'],
  ['ex-main-0574-a/step-3', 'да'],
  ['ex-main-0574-a/step-4', 'DO'],
  ['ex-main-0574-b/step-1', 'MA'],
  ['ex-main-0574-b/step-2', 'KP'],
  ['ex-main-0574-b/step-3', 'KA'],
  ['ex-main-0574-b/step-4', '1'],
  ['ex-main-0574-c/step-1', 'BA'],
  ['ex-main-0574-c/step-2', 'PM'],
  ['ex-main-0574-c/step-3', '1'],
  ['ex-main-0574-c/step-4', 'PA'],
  ['ex-main-0575/step-1', 'AA1'],
  ['ex-main-0575/step-2', 'CC1'],
  ['ex-main-0575/step-3', 'нет'],
  ['ex-main-0575/step-4', 'AC'],
  ['ex-main-0576-a/step-1', 'DC'],
  ['ex-main-0576-a/step-2', 'D'],
  ['ex-main-0576-a/step-3', 'BC1'],
  ['ex-main-0576-a/step-4', '7'],
  ['ex-main-0576-b/step-1', 'BA'],
  ['ex-main-0576-b/step-2', 'AD'],
  ['ex-main-0576-b/step-3', 'CA'],
  ['ex-main-0576-b/step-4', '14'],
  ['ex-main-0577-a/step-1', 'CB'],
  ['ex-main-0577-a/step-2', 'BA-BC'],
  ['ex-main-0577-a/step-3', 'CA'],
  ['ex-main-0577-a/step-4', '14'],
  ['ex-main-0577-b/step-1', 'CC1'],
  ['ex-main-0577-b/step-2', 'AC1'],
  ['ex-main-0577-b/step-3', 'BC'],
  ['ex-main-0577-b/step-4', '-9'],
  ['ex-main-0577-c/step-1', '0'],
  ['ex-main-0577-c/step-2', 'CB1'],
  ['ex-main-0577-c/step-3', 'CB'],
  ['ex-main-0577-c/step-4', '6'],
  ['ex-main-0578/step-1', '1'],
  ['ex-main-0578/step-2', 'O'],
  ['ex-main-0578/step-3', '2'],
  ['ex-main-0578/step-4', '3'],
  ['ex-main-0579/step-1', '1'],
  ['ex-main-0579/step-2', '6'],
  ['ex-main-0579/step-3', '3'],
  ['ex-main-0579/step-4', '30'],
  ['ex-main-0580/step-1', '0.5'],
  ['ex-main-0580/step-2', 'OA'],
  ['ex-main-0580/step-3', '1'],
  ['ex-main-0580/step-4', '1'],
  ['ex-main-0581-a/step-1', '+'],
  ['ex-main-0581-a/step-2', '2'],
  ['ex-main-0581-a/step-3', '1'],
  ['ex-main-0581-a/step-4', '-1'],
  ['ex-main-0581-b/step-1', '-'],
  ['ex-main-0581-b/step-2', '0.5'],
  ['ex-main-0581-b/step-3', '0.5'],
  ['ex-main-0581-b/step-4', '2'],
  ['ex-main-0581-c/step-1', '+'],
  ['ex-main-0581-c/step-2', '2'],
  ['ex-main-0581-c/step-3', '0.5'],
  ['ex-main-0581-c/step-4', '-0.5'],
  ['ex-main-0464-c/step-4', '2.25'], // One of the six equilateral triangles.
]);

function wrongStepAnswers(lessonId, step) {
  const accepted = step.input.accepted;
  const first = accepted[0];
  if (first === 'да') return ['нет'];
  if (first === 'нет') return ['да'];

  const misconception = misconceptions.get(lessonId + '/' + step.id);
  if (misconception) return [misconception];

  const match = /^(\d+)(?:\/(\d+))?$/.exec(first);
  assert(match, 'review a meaningful wrong answer for ' + lessonId + ' ' + step.id);
  const numerator = Number(match[1]) + 1;
  const answers = [match[2] ? numerator + '/' + match[2] : String(numerator)];
  if (accepted.some(answer => /^[а-яё]+$/iu.test(answer))) {
    const wrongWords = {3: 'четыре', 6: 'семь'};
    assert(wrongWords[match[1]], 'review a wrong word for mixed numeric/text input');
    answers.push(wrongWords[match[1]]);
  }
  return answers;
}

module.exports = {wrongStepAnswers};
