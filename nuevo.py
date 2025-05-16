
import os
import json

# --- Functions from baseproyecto.py ---

def generar_estructura_proyecto_json(output_file="estructura_proyecto.json"):
    """
    Generates a JSON file representing the structure of 'src' and 'public' directories,
    listing only the file names within each directory.
    """
    estructura = {
        "src": {},
        "public": {}
    }
    project_root = os.getcwd()

    def process_directory(dir_name, structure_dict):
        dir_path = os.path.join(project_root, dir_name)
        if not os.path.isdir(dir_path):
            print(f"Warning: Directory '{dir_path}' not found.")
            return

        for root, dirs, files in os.walk(dir_path):
            # Exclude top-level itself from path parts
            relative_path = os.path.relpath(root, dir_path)
            if relative_path == '.':
                # Process files directly in the base directory (src or public)
                current_level_files = [f for f in files]
                if current_level_files:
                     # Use a special key or handle directly if needed, here adding to root
                     structure_dict['__files__'] = current_level_files
                continue # Skip creating a '.' entry

            parts = relative_path.split(os.sep)
            current = structure_dict

            # Navigate/create nested directories
            for part in parts:
                 current = current.setdefault(part, {})

            # Add files to the current directory level
            if files:
                 current['__files__'] = files # Using '__files__' to avoid conflict with subdir names


    process_directory('src', estructura['src'])
    process_directory('public', estructura['public'])

    # Clean up keys used for files at root level if they exist and are empty
    if '__files__' in estructura['src'] and not estructura['src']['__files__']:
        del estructura['src']['__files__']
    if '__files__' in estructura['public'] and not estructura['public']['__files__']:
        del estructura['public']['__files__']


    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(estructura, f, indent=2, ensure_ascii=False)
        print(f"Project structure saved to: {output_file}")
    except IOError as e:
        print(f"Error writing to {output_file}: {e}")


def generar_configuracion_proyecto_txt(output_file="configuracion_proyecto.txt"):
    """
    Reads specified configuration files and concatenates their content
    into a single text file.
    """
    archivos_config = [
        "components.json",
        "next.config.ts",
        "package.json",
        "postcss.config.mjs",
        "tailwind.config.ts",
        "tsconfig.json",
        "src/app/globals.css"
    ]
    project_root = os.getcwd()

    try:
        with open(output_file, 'w', encoding='utf-8') as f_out:
            for archivo in archivos_config:
                f_out.write(f"=== {archivo} ===\n")
                file_path = os.path.join(project_root, archivo)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f_in:
                        f_out.write(f_in.read())
                except FileNotFoundError:
                     f_out.write(f"Archivo no encontrado: {file_path}\n")
                except Exception as e:
                    f_out.write(f"No se pudo leer el archivo {file_path}: {str(e)}\n")
                f_out.write("\n\n")
        print(f"Project configuration saved to: {output_file}")
    except IOError as e:
        print(f"Error writing to {output_file}: {e}")


# --- Functions from directorios.py ---

def generar_tree(directorio, prefijo="", es_ultimo=True, output_lines=None, nivel=0):
    """
    Recursively generates a text-based directory tree structure.
    """
    if output_lines is None:
        output_lines = []

    nombre_base = os.path.basename(directorio)
    conector = "└── " if es_ultimo else "├── "

    if nivel == 0: # Special handling for the root directory name
        output_lines.append(f"{nombre_base}/")
        prefijo_hijos = ""
        prefijo_archivos = ""
    else:
        output_lines.append(f"{prefijo}{conector}{nombre_base}/")
        prefijo_hijos = prefijo + ("    " if es_ultimo else "│   ")
        prefijo_archivos = prefijo + ("    " if es_ultimo else "│   ")


    try:
        # List content, separating dirs and files
        contenido = sorted(os.listdir(directorio))
        dirs = [item for item in contenido if os.path.isdir(os.path.join(directorio, item))]
        files = [item for item in contenido if os.path.isfile(os.path.join(directorio, item))]

        elementos = dirs + files
        total_elementos = len(elementos)

        for i, item in enumerate(elementos):
            path_completo = os.path.join(directorio, item)
            ultimo_elemento = (i == total_elementos - 1)

            if os.path.isdir(path_completo):
                 generar_tree(path_completo, prefijo_hijos, ultimo_elemento, output_lines, nivel + 1)
            else:
                 conector_archivo = "└── " if ultimo_elemento else "├── "
                 output_lines.append(f"{prefijo_archivos}{conector_archivo}{item}")

    except PermissionError:
        output_lines.append(f"{prefijo_archivos}└── [Error: Permiso denegado]")
    except FileNotFoundError:
         output_lines.append(f"{prefijo_archivos}└── [Error: Directorio no encontrado]") # Should not happen if initial check passes

    return output_lines


def guardar_estructura_directorios_txt(output_file="estructura_directorios.txt"):
    """
    Generates directory tree structures for 'public' and 'src'
    and saves them to a text file.
    """
    project_root = os.getcwd()
    directorios = [
        os.path.join(project_root, "public"),
        os.path.join(project_root, "src")
    ]

    try:
        with open(output_file, "w", encoding="utf-8") as f:
            for directorio in directorios:
                 if os.path.isdir(directorio):
                      f.write(f"Estructura de: {directorio}\n")
                      tree_lines = generar_tree(directorio)
                      f.write("\n".join(tree_lines))
                      f.write("\n\n")
                 else:
                     f.write(f"Directorio no encontrado: {directorio}\n\n")
        print(f"Directory tree structure saved to: {output_file}")
    except IOError as e:
        print(f"Error writing to {output_file}: {e}")


# --- Functions from versrc.py ---

def escanear_directorio_con_contenido(ruta_base, excluir=None):
    """
    Scans a directory recursively and returns a nested dictionary
    representing the structure, including the content of text files.
    """
    estructura = {}
    excluir = excluir or [] # Ensure excluir is a list

    if not os.path.isdir(ruta_base):
        print(f"Warning: Base directory '{ruta_base}' not found.")
        return estructura

    for root, dirs, files in os.walk(ruta_base, topdown=True):
        # Filter excluded files
        files = [f for f in files if f not in excluir]
        # Optional: Filter excluded directories if needed (simple exclusion)
        # dirs[:] = [d for d in dirs if d not in exclude_dirs]

        # Get relative path and parts
        rel_path = os.path.relpath(root, ruta_base)
        parts = [] if rel_path == '.' else rel_path.split(os.sep)

        # Navigate to the current level in the structure dictionary
        actual = estructura
        for parte in parts:
            actual = actual.setdefault(parte, {}) # Use setdefault to create if not exists

        # Process files and add their content
        archivos_contenido = {}
        for file in files:
            file_path = os.path.join(root, file)
            try:
                # Attempt to read as UTF-8, handle potential errors
                with open(file_path, 'r', encoding='utf-8') as f:
                    contenido = f.read()
                archivos_contenido[file] = contenido
            except UnicodeDecodeError:
                 # Fallback or indication for binary files
                 archivos_contenido[file] = "[Archivo binario o codificación no UTF-8]"
            except IOError as e:
                 archivos_contenido[file] = f"[Error al leer archivo: {str(e)}]"
            except Exception as e:
                archivos_contenido[file] = f"[Error inesperado al leer: {str(e)}]"

        # Add files content under a special key if there are files
        if archivos_contenido:
            actual['__archivos__'] = archivos_contenido # Using '__archivos__'

    return estructura

def generar_estructura_src_json(output_file="estructura_src.json"):
    """
    Generates a JSON file representing the structure of the 'src' directory,
    including the content of the files.
    """
    project_root = os.getcwd()
    ruta_src = os.path.join(project_root, 'src')
    archivos_excluir = ['favicon.ico'] # Example exclusion list

    estructura = escanear_directorio_con_contenido(ruta_src, excluir=archivos_excluir)

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(estructura, f, indent=2, ensure_ascii=False)
        print(f"Detailed src structure with content saved to: {output_file}")
    except IOError as e:
        print(f"Error writing to {output_file}: {e}")


# --- Main Execution ---

def main():
    """
    Runs all the project analysis and documentation generation functions.
    """
    print("Starting project analysis...")

    generar_estructura_proyecto_json()
    generar_configuracion_proyecto_txt()
    guardar_estructura_directorios_txt()
    generar_estructura_src_json()

    print("\nProject analysis complete. Generated files:")
    print("- estructura_proyecto.json")
    print("- configuracion_proyecto.txt")
    print("- estructura_directorios.txt")
    print("- estructura_src.json")

if __name__ == "__main__":
    main()

    