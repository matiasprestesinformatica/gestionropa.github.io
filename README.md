
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Project Overview and Key Features

This application is a personal wardrobe management system, "EstilosIA," designed to help users organize their clothing, create outfits (looks), get AI-powered suggestions, plan their attire using a calendar, track usage statistics, and manage a wishlist.

### Main Pages and Functionalities:

1.  **Dashboard (Homepage - `/`)**:
    *   Provides a visual summary of the user's wardrobe.
    *   **Components**:
        *   `StatsCard`: Displays key statistics like total prendas (clothing items) and total looks.
        *   `ColorDistributionChart`: Shows a pie chart of the most frequent colors in the wardrobe.
        *   `OutfitSuggestion`: Presents a randomly generated outfit suggestion based on available items and AI logic.
    *   **Functionality**: Fetches and displays aggregated data, offers a quick AI suggestion.

2.  **Sugerencias AI (`/sugerenciaia`)**:
    *   The core page for generating AI-powered outfit suggestions.
    *   **Components**:
        *   `TemperatureControl`: Slider for users to input a temperature range.
        *   `StyleSelection`: Cards for users to select a style (e.g., Casual, Formal).
        *   Checkbox: To indicate if the AI should consider items from the user's closet.
        *   `OutfitSuggestion`: Displays the AI-generated outfit, including item images, names, categories, and colors.
        *   `OutfitExplanation`: Shows the AI's reasoning behind the suggestion, with an option to copy the text.
        *   `SuggestionHistory`: Lists previously generated suggestions from `localStorage`, allowing users to re-apply them.
        *   `InspirationCard`: Shows a random style tip or quote.
        *   Textarea: For users to add personal notes about the current suggestion (saved to `localStorage`).
    *   **Functionality**: Users input temperature and style, and the system calls an AI flow (`generateOutfitExplanation`) to suggest an outfit from their wardrobe and explain it.

3.  **Mi Armario (`/closet`)**:
    *   Manages the user's entire collection of clothing items (prendas).
    *   **Components**:
        *   `ClosetFilterBar`: Allows filtering prendas by name, type, style, and season.
        *   `GridCardsToggle`: Switches the display between a table view and a card grid view.
        *   `ClothingTable`: Displays prendas in a sortable, detailed table with edit/delete actions.
        *   `ClothingCard`: Displays prendas in a responsive card format for the grid view.
        *   `ClothingForm`: A dialog-based form (reusable) for adding new prendas or editing existing ones, with fields for all prenda attributes (nombre, tipo, color, modelo, temporada, fechacompra, imagen_url, temperatura, estilo, is_archived).
        *   `AlertDialog`: For confirming deletions.
    *   **Functionality**: Full CRUD (Create, Read, Update, Delete) operations for prendas, with client-side filtering and multiple view options.

4.  **Mis Looks (`/looks`)**:
    *   Allows users to create, view, edit, and delete "Looks" (predefined outfits).
    *   **Components**:
        *   `LookCard`: Displays each saved look with its name, image, style, and a summary of included prendas.
        *   `LookForm`: A dialog-based form for creating or editing looks, including a multi-select with search for choosing prendas from the armario.
        *   `AlertDialog`: For confirming look deletions.
    *   **Functionality**: CRUD for looks, linking multiple prendas to a single look.

5.  **Calendario (`/calendario`)**:
    *   Enables users to assign prendas or looks to specific dates.
    *   **Components**:
        *   `Calendar` (ShadCN): Displays a monthly calendar. Days with assignments are visually marked.
        *   `AssignmentCard`: Shows the details of the prenda or look assigned to the selected date.
        *   `AssignmentModal`: A dialog to create or edit assignments, allowing selection of a prenda or look and adding notes.
    *   **Functionality**: CRUD for calendar assignments, visual planning of outfits.

6.  **Estadísticas (`/statistics`)**:
    *   Presents visual statistics about the user's wardrobe and usage.
    *   **Components**:
        *   `StatsCard`: Shows summary numbers (total prendas, looks, styles, looks used this month).
        *   `ColorDistributionChart`: Pie chart of prenda colors.
        *   `StyleUsageChart`: Bar chart showing the number of prendas per style.
        *   `TimeActivityChart`: Bar or line chart showing looks/prendas used over time (based on calendar assignments).
        *   `IntelligentInsightCard`: Offers simple AI-driven observations or suggestions based on usage patterns.
    *   **Functionality**: Fetches and visualizes aggregated data to provide insights into wardrobe composition and usage.

7.  **Archivo (`/archivo`)**:
    *   Displays prendas that have been marked as "archived".
    *   **Components**:
        *   `Card`: Displays each archived prenda with its image and basic details.
        *   Button: To "Restaurar al Armario" (unarchive).
    *   **Functionality**: Allows users to manage items they don't currently use without deleting them permanently.

8.  **Lista de Deseos (`/deseos`)**:
    *   A page for users to keep track of items they wish to acquire. (Currently uses mock data and `localStorage`).
    *   **Components**:
        *   `WishlistItemCard`: Displays each wishlist item with its image, name, price, and status (pending, purchased, discarded).
        *   `WishlistForm`: A dialog for adding or editing wishlist items.
    *   **Functionality**: CRUD for wishlist items, status updates.

9.  **Configuración (`/configuracion`)**:
    *   Allows users to set personal preferences. (Currently a placeholder form structure).
    *   **Fields (Planned)**: Favorite color palette, predominant style, default sizes, dark mode toggle, email.
    *   **Functionality**: To save user-specific settings that might influence app behavior or suggestions in the future.

10. **Política de Privacidad (`/privacy-policy`)**:
    *   A static page displaying the application's privacy policy.

---

**To understand or modify a specific feature, consider the following prompt structure:**

"Regarding the **[Page Name]** page, I want to **[action to perform, e.g., 'modify the filtering logic', 'change the layout of the cards', 'add a new field to the form']** for the **[specific component or functionality, e.g., 'ClosetFilterBar', 'LookCard component', 'prenda creation process']**. The goal is to **[desired outcome or reason for the change, e.g., 'allow filtering by color', 'display the look description more prominently', 'capture the brand of the clothing item']**."
