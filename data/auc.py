import numpy as np
from scipy.integrate import simpson
from numpy import trapz


# The y values.  A numpy array is used here,
# but a python list could also be used.
y = np.array([771900, 771500, 770500, 770400, 771000, 772400, 774100, 776700, 777100, 779200])

# Compute the area using the composite trapezoidal rule.
area = trapz(y, dx=1)
print("area =", area)

# Compute the area using the composite Simpson's rule.
area = simpson(y, dx=1)
print("area =", area)