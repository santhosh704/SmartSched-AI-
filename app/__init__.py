import importlib, sys, pkgutil

# Load the original backend.app package
_backend_pkg = importlib.import_module('backend.app')

# Register the top-level "app" name to point to the same module object
sys.modules[__name__] = _backend_pkg

# Alias all submodules so that "app.<submodule>" resolves to "backend.app.<submodule>"
for loader, name, is_pkg in pkgutil.iter_modules(_backend_pkg.__path__):
    full_name = f'backend.app.{name}'
    alias_name = f'app.{name}'
    sys.modules[alias_name] = importlib.import_module(full_name)
    # If the submodule is a package, also alias its subpackages recursively
    if is_pkg:
        sub_pkg = sys.modules[full_name]
        for sub_loader, sub_name, sub_is_pkg in pkgutil.iter_modules(sub_pkg.__path__):
            sub_full = f'{full_name}.{sub_name}'
            sub_alias = f'{alias_name}.{sub_name}'
            sys.modules[sub_alias] = importlib.import_module(sub_full)

# Ensure package path for relative imports
__path__ = getattr(_backend_pkg, '__path__', [])
