/**
 * Convert a number to French words with DZD currency
 * Native implementation to avoid external dependencies that cause production crashes.
 */

const UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

function convertUnderThousand(n: number): string {
    if (n === 0) return '';
    if (n < 20) return UNITS[n];
    if (n < 100) {
        const ten = Math.floor(n / 10);
        const unit = n % 10;

        // Handle special French cases
        if (ten === 7) return `soixante-${convertUnderThousand(10 + unit)}`; // 70-79
        if (ten === 9) return `quatre-vingt-${convertUnderThousand(10 + unit)}`; // 90-99
        if (ten === 8) { // 80-89
            if (unit === 0) return 'quatre-vingts';
            return `quatre-vingt-${UNITS[unit]}`;
        }

        // Standard 20-69
        const tenWord = TENS[ten];
        if (unit === 0) return tenWord;
        if (unit === 1) return `${tenWord} et un`;
        return `${tenWord}-${UNITS[unit]}`;
    }

    // Hundreds
    if (n < 1000) {
        const hundred = Math.floor(n / 100);
        const rest = n % 100;
        let result = '';
        if (hundred === 1) result = 'cent';
        else result = `${UNITS[hundred]} cents`;

        if (rest === 0) return result;

        // Fix "cents" to "cent" if followed by something
        if (hundred > 1) result = `${UNITS[hundred]} cent`;

        return `${result} ${convertUnderThousand(rest)}`;
    }
    return '';
}

function numberToFrench(n: number): string {
    if (n === 0) return 'zéro';

    const convertGroup = (val: number): string => {
        if (val === 0) return '';
        if (val < 20) return UNITS[val];
        if (val < 100) {
            const ten = Math.floor(val / 10);
            const unit = val % 10;
            if (ten === 7) {
                const suffix = unit === 1 ? ' et onze' : `-${convertGroup(10 + unit)}`;
                return `soixante${suffix}`;
            }
            if (ten === 9) return `quatre-vingt-${convertGroup(10 + unit)}`;
            if (ten === 8) {
                if (unit === 0) return 'quatre-vingts';
                return `quatre-vingt-${unit === 1 ? 'un' : UNITS[unit]}`;
            }
            const tenWord = TENS[ten];
            if (unit === 0) return tenWord;
            if (unit === 1) return `${tenWord} et un`;
            return `${tenWord}-${UNITS[unit]}`;
        }
        const hundred = Math.floor(val / 100);
        const rest = val % 100;
        let hText = hundred === 1 ? 'cent' : `${UNITS[hundred]} cents`;
        if (rest > 0) {
            hText = hundred === 1 ? 'cent' : `${UNITS[hundred]} cent`;
            return `${hText} ${convertGroup(rest)}`;
        }
        return hText;
    };

    if (n < 1000) return convertGroup(n);
    if (n < 1000000) {
        const thousands = Math.floor(n / 1000);
        const rest = n % 1000;
        const tText = thousands === 1 ? 'mille' : `${convertGroup(thousands)} mille`;
        if (rest === 0) return tText;
        return `${tText} ${convertGroup(rest)}`;
    }
    if (n < 1000000000) {
        const millions = Math.floor(n / 1000000);
        const rest = n % 1000000;
        const mText = millions === 1 ? 'un million' : `${convertGroup(millions)} millions`;
        if (rest === 0) return mText;
        return `${mText} ${numberToFrench(rest)}`;
    }

    return n.toString();
}

export function numberToFrenchWords(amount: number): string {
    if (amount === 0) {
        return 'Zéro dinars';
    }

    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    let result = '';

    // Convert integer part to words
    if (integerPart > 0) {
        const integerWords = numberToFrench(integerPart);
        result = integerWords.charAt(0).toUpperCase() + integerWords.slice(1);
        result += integerPart === 1 ? ' dinar' : ' dinars';
    }

    // Add decimal part if exists
    if (decimalPart > 0) {
        const decimalWords = numberToFrench(decimalPart);
        result += (result ? ' et ' : '') + decimalWords + (decimalPart === 1 ? ' centime' : ' centimes');
    }

    return result;
}
