
import os

def listar_estructura_directorio(directorio_raiz, archivo_salida):
    """
    Genera la estructura de un directorio y sus subdirectorios/archivos
    en un archivo de texto.

    Args:
        directorio_raiz (str): La ruta al directorio que se va a listar.
        archivo_salida (str): La ruta al archivo .txt donde se guardará la estructura.
    """
    try:
        with open(archivo_salida, 'w', encoding='utf-8') as f:
            f.write(f"Estructura del directorio: {os.path.abspath(directorio_raiz)}\n")
            f.write("=" * (28 + len(os.path.abspath(directorio_raiz))) + "\n\n")

            for raiz, directorios, archivos in os.walk(directorio_raiz):
                # Calcula la profundidad para la indentación
                nivel = raiz.replace(directorio_raiz, '').count(os.sep)
                indentacion = ' ' * 4 * nivel

                # Escribe el directorio actual
                f.write(f"{indentacion}[{os.path.basename(raiz)}/]\n")

                # Indentación para los subelementos
                sub_indentacion = ' ' * 4 * (nivel + 1)

                # Escribe los subdirectorios
                for d in sorted(directorios):
                    f.write(f"{sub_indentacion}[{d}/]\n")
                
                # Escribe los archivos
                for archivo in sorted(archivos):
                    f.write(f"{sub_indentacion}- {archivo}\n")
                
                if directorios or archivos:
                     f.write("\n") # Añade un salto de línea después de listar los contenidos de una carpeta

        print(f"La estructura del directorio '{directorio_raiz}' se ha guardado en '{archivo_salida}'")

    except FileNotFoundError:
        print(f"Error: El directorio '{directorio_raiz}' no fue encontrado.")
    except Exception as e:
        print(f"Ocurrió un error: {e}")

if __name__ == "__main__":
    # Define el directorio src relativo a la ubicación del script
    # __file__ es la ruta del script actual (verproyecto.py)
    # os.path.dirname(__file__) es el directorio donde está el script
    # os.path.join(os.path.dirname(__file__), 'src') crea la ruta a 'src'
    directorio_src = os.path.join(os.path.dirname(__file__), 'src')
    
    # Define el nombre del archivo de salida en el mismo directorio que el script
    archivo_txt_salida = os.path.join(os.path.dirname(__file__), 'src_structure.txt')

    # Llama a la función para listar la estructura
    listar_estructura_directorio(directorio_src, archivo_txt_salida)
