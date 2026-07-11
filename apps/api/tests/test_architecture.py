"""Static dependency rules for future business modules."""

import ast
from pathlib import Path

MODULES_ROOT = Path(__file__).parents[1] / "src" / "kernelon_api" / "modules"
DOMAIN_FORBIDDEN = {"advanced_alchemy", "litestar", "pydantic", "pydantic_settings", "sqlalchemy"}
APPLICATION_FORBIDDEN = {"infrastructure", "presentation"}


def imported_modules(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    imports: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            imports.add(node.module)
    return imports


def test_domain_and_application_dependency_direction() -> None:
    violations: list[str] = []
    for path in MODULES_ROOT.rglob("*.py"):
        imports = imported_modules(path)
        if "domain" in path.parts:
            forbidden = [item for item in imports if item.split(".")[0] in DOMAIN_FORBIDDEN]
            violations.extend(f"{path}: imports {item}" for item in forbidden)
        if "application" in path.parts:
            forbidden = [
                item
                for item in imports
                if any(segment in item.split(".") for segment in APPLICATION_FORBIDDEN)
            ]
            violations.extend(f"{path}: imports {item}" for item in forbidden)

    assert not violations, "Architecture dependency violations:\n" + "\n".join(violations)
