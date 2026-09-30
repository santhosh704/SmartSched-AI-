import importlib, sys
backend_tests = importlib.import_module('backend.tests')
# expose as this package
sys.modules[__name__] = backend_tests
