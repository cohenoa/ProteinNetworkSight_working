import os
import re
import json
from collections import defaultdict
from packaging import version
from packaging.specifiers import SpecifierSet

def check_version(requirement, actual_version):
    """
    Check if the actual version meets the requirement.

    :param requirement: A string specifying the version requirement (e.g., ">=1.2.0, <2.0.0").
    :param actual_version: The version to check against the requirement.
    :return: Boolean indicating whether the actual version satisfies the requirement.
    """
    specifier_set = SpecifierSet(requirement)
    return version.parse(actual_version) in specifier_set

def find_tsx_imports(root_dir):
    libraries = set()
    tsx_file_pattern = re.compile(r'\.tsx$')
    import_pattern = re.compile(r'^import .* from ["\']([^"\'.\/][^"\']*)["\'];', re.M)

    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if tsx_file_pattern.search(file):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    matches = import_pattern.findall(content)
                    libraries.update(matches)

    return list(libraries)

def get_library_versions_and_deps(package_lock_path, libraries):
    with open(package_lock_path, 'r', encoding='utf-8') as f:
        package_lock_data = json.load(f)
    
    dependencies = package_lock_data.get('packages', {})
    library_info = {}
    
    for lib in libraries:
        libName = 'node_modules/' + lib
        if libName in dependencies:
            lib_info = dependencies[libName]
            library_info[lib] = {
                'version': lib_info.get('version'),
                'dependencies': lib_info.get('dependencies', {}),
                'peerDependencies': lib_info.get('peerDependencies', {})
            }
    
    return library_info

def find_conflicts(used_libraries: dict):

    # all_deps = defaultdict(list)

    # Filter dependencies to include only those that are used in .tsx files
    # for key, value in used_libraries.items():
    #     all_deps[key].append(used_libraries[key]['version'])

    # Filter to find conflicts: more than one version for the same package
    conflicts = {}
    for pkg, versions in used_libraries.items():
        print(pkg)
        print(versions)
        # unique_versions = set(versions)
        # if len(unique_versions) > 1:
        #     print(f"Conflict found in package: {pkg}, Versions: {unique_versions}")
        #     conflicts[pkg] = versions

    return conflicts

# Replace these paths with your actual file paths
root_directory = './frontend/src'
package_lock_path = './frontend/package-lock.json'

imported_libraries = find_tsx_imports(root_directory)
library_versions_and_deps = get_library_versions_and_deps(package_lock_path, imported_libraries)
# conflict_info = find_conflicts(library_versions_and_deps)

print("Library versions and dependencies(" + str(len(imported_libraries)) + "):")
for lib, info in library_versions_and_deps.items():
    print(f"{lib}: Version {info['version']}, Dependencies {info['dependencies']}, Peer Dependencies {info['peerDependencies']}\n")



# print("\nConflicting packages:")
# for pkg, versions in conflict_info.items():
#     print(f"{pkg}: Versions {versions}")


# with open('libraries.json', 'w') as f:
#     json.dump(library_versions_and_deps, f, indent=4)

# imported_libraries = find_tsx_imports(root_directory)

# print("Libraries imported in .tsx files:")
# for lib in imported_libraries:
#     print(lib)