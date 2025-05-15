import os

def listar_archivos_en_directorio(ruta_directorio):
  """
  Lista los nombres de los archivos en un directorio dado.

  Args:
    ruta_directorio: La ruta al directorio.

  Returns:
    Una cadena de texto con los nombres de los archivos, uno por línea,
    o un mensaje de error si el directorio no existe o no se puede acceder.
  """
  nombres_archivos = []
  try:
    # Obtener la lista de todos los elementos en el directorio
    elementos = os.listdir(ruta_directorio)

    # Filtrar solo los archivos
    for elemento in elementos:
      ruta_completa = os.path.join(ruta_directorio, elemento)
      if os.path.isfile(ruta_completa):
        nombres_archivos.append(elemento)

    # Unir los nombres de los archivos en una sola cadena con saltos de línea
    return "\n".join(nombres_archivos)

  except FileNotFoundError:
    return f"Error: El directorio '{ruta_directorio}' no fue encontrado."
  except Exception as e:
    return f"Ocurrió un error al acceder al directorio: {e}"

# Define la ruta al directorio que quieres listar
directorio_ropa = "public/ropa"

# Llama a la función y imprime el resultado
resultado = listar_archivos_en_directorio(directorio_ropa)
print(resultado)
