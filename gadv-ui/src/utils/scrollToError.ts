import React from 'react';

/**
 * Fonction utilitaire pour scroller automatiquement vers le premier champ en erreur
 * @param errors - Objet contenant les erreurs de validation
 * @param offset - Nombre de pixels au-dessus de l'élément (par défaut 100)
 * 
 * @example
 * // Utilisation basique
 * const errors = { email: 'Email requis', password: 'Mot de passe invalide' };
 * scrollToFirstError(errors);
 * 
 * @example
 * // Avec offset personnalisé
 * scrollToFirstError(errors, 150); // 150px au-dessus de l'élément
 */
export const scrollToFirstError = (errors: Record<string, string>, offset: number = 100): void => {
  const errorKeys = Object.keys(errors);
  if (errorKeys.length === 0) return;

  const firstErrorField = errorKeys[0];
  
  // Chercher l'élément par différents sélecteurs possibles
  const selectors = [
    `[name="${firstErrorField}"]`,           // Par attribut name
    `#${firstErrorField}`,                   // Par ID
    `[data-field="${firstErrorField}"]`,     // Par attribut data-field
    `[data-error-key="${firstErrorField}"]`, // Par attribut data-error-key personnalisé
    `.field-${firstErrorField}`,             // Par classe CSS
  ];
  
  let element: Element | null = null;
  
  // Essayer chaque sélecteur jusqu'à trouver l'élément
  for (const selector of selectors) {
    element = document.querySelector(selector);
    if (element) break;
  }
  
  if (element) {
    // Calculer la position avec l'offset pour éviter que l'élément soit masqué par le header
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    // Scroller en douceur vers l'élément
    window.scrollTo({
      top: Math.max(0, offsetPosition), // S'assurer que la position n'est pas négative
      behavior: 'smooth'
    });

    // Optionnel : mettre le focus sur l'élément si c'est un champ de saisie
    if (element instanceof HTMLInputElement || 
        element instanceof HTMLTextAreaElement || 
        element instanceof HTMLSelectElement) {
      setTimeout(() => {
        const focusableElement = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        focusableElement.focus();
        // Ajouter une classe pour surligner temporairement le champ
        focusableElement.classList.add('error-highlight');
        setTimeout(() => {
          focusableElement.classList.remove('error-highlight');
        }, 2000);
      }, 300);
    }
  } else {
    console.warn(`Élément avec les erreurs non trouvé pour le champ: ${firstErrorField}`);
    console.info('Sélecteurs essayés:', selectors);
  }
};

/**
 * Fonction pour ajouter les styles CSS d'erreur automatiquement
 */
export const addErrorStyles = (): void => {
  // Vérifier si les styles ont déjà été ajoutés
  if (document.getElementById('scroll-error-styles')) return;

  const style = document.createElement('style');
  style.id = 'scroll-error-styles';
  style.textContent = `
    .error-highlight {
      animation: errorPulse 0.5s ease-in-out 2;
      box-shadow: 0 0 0 2px #ef4444 !important;
      border-color: #ef4444 !important;
      transition: all 0.3s ease;
    }
    
    @keyframes errorPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }
    
    .field-error {
      border-color: #ef4444 !important;
      background-color: #fef2f2 !important;
    }
    
    /* Style pour les messages d'erreur */
    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      animation: fadeInError 0.3s ease-in;
    }
    
    @keyframes fadeInError {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  
  document.head.appendChild(style);
};

/**
 * Hook personnalisé pour initialiser automatiquement les styles d'erreur
 * 
 * @example
 * // Dans un composant React
 * const MyForm = () => {
 *   const scrollToError = useErrorScrolling();
 *   
 *   const handleSubmit = (errors) => {
 *     if (Object.keys(errors).length > 0) {
 *       scrollToError(errors);
 *     }
 *   };
 * };
 */
export const useErrorScrolling = () => {
  React.useEffect(() => {
    addErrorStyles();
  }, []);
  
  return scrollToFirstError;
};



/* 
GUIDE D'UTILISATION :

1. BASIC USAGE - Dans la fonction de validation :
   ```javascript
   const validate = () => {
     const errors = {};
     if (!email) errors.email = 'Email requis';
     if (!password) errors.password = 'Mot de passe requis';
     
     setErrors(errors);
     
     if (Object.keys(errors).length > 0) {
       setTimeout(() => {
         scrollToFirstError(errors, 120); // 120px pour les headers fixes
       }, 100);
     }
     
     return Object.keys(errors).length === 0;
   };
   ```

2. AVEC HOOK - Au début du composant :
   ```javascript
   const scrollToError = useErrorScrolling();
   ```

3. ATTRIBUTS REQUIS - Sur vos champs de formulaire :
   ```html
   <input name="email" ... />
   <!-- OU -->
   <input id="email" ... />
   <!-- OU -->
   <div data-field="email">
     <select>...</select>
   </div>
   ```

4. STYLES AUTOMATIQUES - Les styles CSS sont ajoutés automatiquement,
   mais vous pouvez les personnaliser en modifiant la fonction addErrorStyles()
*/ 