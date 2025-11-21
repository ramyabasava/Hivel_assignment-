const fs = require('fs');

// 1. Decode function (same as before)
function decodeBaseValue(valueStr, base) {
    const radix = BigInt(base);
    let decodedValue = 0n;
    for (let i = 0; i < valueStr.length; i++) {
        const char = valueStr[i];
        let digit = 0n;
        if (char >= '0' && char <= '9') digit = BigInt(char.charCodeAt(0) - 48);
        else if (char >= 'a' && char <= 'z') digit = BigInt(char.charCodeAt(0) - 87);
        else if (char >= 'A' && char <= 'Z') digit = BigInt(char.charCodeAt(0) - 55);
        decodedValue = decodedValue * radix + digit;
    }
    return decodedValue;
}

// 2. Lagrange Interpolation for a specific set of k points
function calculateLagrange(points) {
    const k = points.length;
    let finalNumerator = 0n;
    let finalDenominator = 1n;

    for (let i = 0; i < k; i++) {
        let xi = points[i].x;
        let yi = points[i].y;

        let termNumerator = 1n;
        let termDenominator = 1n;

        for (let j = 0; j < k; j++) {
            if (i !== j) {
                let xj = points[j].x;
                termNumerator *= (-xj);
                termDenominator *= (xi - xj);
            }
        }

        // term = yi * (termNumerator / termDenominator)
        // Add to total: finalNum/finalDen + (yi * termNum)/termDen
        let termValue = yi * termNumerator;
        finalNumerator = (finalNumerator * termDenominator) + (termValue * finalDenominator);
        finalDenominator = finalDenominator * termDenominator;
    }

    return { num: finalNumerator, den: finalDenominator };
}

// 3. Helper to generate combinations of points
function getCombinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length === 0) return [];
    
    const first = arr[0];
    const rest = arr.slice(1);
    
    const combsWithFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
    const combsWithoutFirst = getCombinations(rest, k);
    
    return [...combsWithFirst, ...combsWithoutFirst];
}

function findSecretConstant() {
    try {
        const rawContent = fs.readFileSync('input.json', 'utf-8');
        const inputData = JSON.parse(rawContent);
        const { n, k } = inputData.keys;

        let points = [];
        for (const key in inputData) {
            if (key === 'keys') continue;
            const x = BigInt(key);
            const base = parseInt(inputData[key].base);
            const y = decodeBaseValue(inputData[key].value, base);
            points.push({ x, y });
        }

        // Because the input might have invalid points, we try to find 
        // a subset of size k that produces a VALID integer result (no remainder).
        
        // If n is small enough, we can brute force combinations
        if (points.length <= 12) { // 10 choose 7 is only 120 combinations
            const combinations = getCombinations(points, k);
            
            for (const subset of combinations) {
                const result = calculateLagrange(subset);
                
                // Check if the result is an integer (denominator divides numerator perfectly)
                if (result.den !== 0n && result.num % result.den === 0n) {
                    const secret = result.num / result.den;
                    
                    // Usually secrets are positive. If we find a positive integer, likely correct.
                    if (secret > 0n) {
                        console.log(secret.toString());
                        return;
                    }
                }
            }
        } else {
            // Fallback to first k if too many points (not the case here)
            const result = calculateLagrange(points.slice(0, k));
            console.log((result.num / result.den).toString());
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

findSecretConstant();