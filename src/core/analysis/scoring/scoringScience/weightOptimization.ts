/**
 * Rubric Weight Optimization & Principal Component Analysis
 *
 * Provides tools for periodically recalibrating rubric dimension weights
 * based on actual scoring data. Two main capabilities:
 *
 * 1. GRADIENT DESCENT OPTIMIZATION: Given a target quality metric (e.g.,
 *    user satisfaction, expert agreement), optimize weights to maximize
 *    predictive accuracy.
 *
 * 2. PRINCIPAL COMPONENT ANALYSIS: Discover the "true" underlying
 *    dimensions by analyzing correlations between rubric dimensions.
 *    If two dimensions are highly correlated, one may be redundant.
 *
 * PIPELINE POSITION: Offline calibration (not per-essay)
 * PERFORMANCE: Depends on dataset size; O(n*k^2) for PCA where n=essays, k=dimensions
 *
 * ACCURACY IMPROVEMENT: Ensures rubric weights reflect actual predictive
 * value rather than theoretical design intent. Identifies redundant
 * dimensions that inflate or deflate quality indices.
 */

import {
  WeightOptimizationResult,
} from './types';

// ============================================================================
// CORRELATION COMPUTATION
// ============================================================================

/**
 * Compute the Pearson correlation matrix between dimensions.
 *
 * @param scoreMatrix - Array of essays, each being a Record<dimension, score>
 * @returns Correlation matrix as nested Record
 */
export function computeCorrelationMatrix(
  scoreMatrix: Array<Record<string, number>>
): Record<string, Record<string, number>> {
  if (scoreMatrix.length < 3) {
    return {};
  }

  // Get all dimensions
  const dimensions = Object.keys(scoreMatrix[0]);
  const n = scoreMatrix.length;

  // Compute means
  const means: Record<string, number> = {};
  for (const dim of dimensions) {
    means[dim] = scoreMatrix.reduce((s, row) => s + (row[dim] || 0), 0) / n;
  }

  // Compute standard deviations
  const stdDevs: Record<string, number> = {};
  for (const dim of dimensions) {
    const variance = scoreMatrix.reduce(
      (s, row) => s + ((row[dim] || 0) - means[dim]) ** 2,
      0
    ) / (n - 1);
    stdDevs[dim] = Math.sqrt(variance);
  }

  // Compute correlation matrix
  const corr: Record<string, Record<string, number>> = {};
  for (const dimA of dimensions) {
    corr[dimA] = {};
    for (const dimB of dimensions) {
      if (dimA === dimB) {
        corr[dimA][dimB] = 1.0;
        continue;
      }

      const sdProduct = stdDevs[dimA] * stdDevs[dimB];
      if (sdProduct === 0) {
        corr[dimA][dimB] = 0;
        continue;
      }

      const covariance = scoreMatrix.reduce(
        (s, row) => s + ((row[dimA] || 0) - means[dimA]) * ((row[dimB] || 0) - means[dimB]),
        0
      ) / (n - 1);

      corr[dimA][dimB] = Math.round((covariance / sdProduct) * 1000) / 1000;
    }
  }

  return corr;
}

// ============================================================================
// SIMPLIFIED PCA (Power Iteration Method)
// ============================================================================

/**
 * Perform simplified PCA using the power iteration method.
 *
 * Full PCA requires eigendecomposition of the covariance matrix.
 * For our use case (11-12 dimensions), we use a simplified approach:
 *
 * 1. Compute the correlation matrix (standardized covariance)
 * 2. Use power iteration to find the top eigenvectors
 * 3. Interpret components as "underlying quality factors"
 *
 * @param scoreMatrix - Historical scores (array of score records)
 * @param numComponents - Number of components to extract
 */
export function simplifiedPCA(
  scoreMatrix: Array<Record<string, number>>,
  numComponents: number = 5
): WeightOptimizationResult['pca_analysis'] {
  if (scoreMatrix.length < 5) {
    return {
      components_for_90_pct: 0,
      components: [],
      redundant_pairs: [],
    };
  }

  const dimensions = Object.keys(scoreMatrix[0]);
  const k = dimensions.length;
  const n = scoreMatrix.length;

  // Standardize the data
  const means: number[] = dimensions.map(
    dim => scoreMatrix.reduce((s, r) => s + (r[dim] || 0), 0) / n
  );
  const stds: number[] = dimensions.map((dim, i) => {
    const variance = scoreMatrix.reduce(
      (s, r) => s + ((r[dim] || 0) - means[i]) ** 2,
      0
    ) / (n - 1);
    return Math.sqrt(variance) || 1;
  });

  // Build standardized data matrix
  const data: number[][] = scoreMatrix.map(row =>
    dimensions.map((dim, i) => ((row[dim] || 0) - means[i]) / stds[i])
  );

  // Compute correlation matrix as flat array for iteration
  const corrMatrix: number[][] = [];
  for (let i = 0; i < k; i++) {
    corrMatrix[i] = [];
    for (let j = 0; j < k; j++) {
      let sum = 0;
      for (let r = 0; r < n; r++) {
        sum += data[r][i] * data[r][j];
      }
      corrMatrix[i][j] = sum / (n - 1);
    }
  }

  // Power iteration to find eigenvalues and eigenvectors
  const components: WeightOptimizationResult['pca_analysis']['components'] = [];
  const residualMatrix = corrMatrix.map(row => [...row]); // Deep copy

  const totalVariance = dimensions.length; // For standardized data, total = k

  let cumulativeVariance = 0;

  for (let comp = 0; comp < Math.min(numComponents, k); comp++) {
    // Initialize random vector
    let vector = Array(k).fill(0).map(() => Math.random());
    let eigenvalue = 0;

    // Power iteration (50 iterations is usually enough)
    for (let iter = 0; iter < 50; iter++) {
      // Multiply matrix by vector
      const newVector = Array(k).fill(0);
      for (let i = 0; i < k; i++) {
        for (let j = 0; j < k; j++) {
          newVector[i] += residualMatrix[i][j] * vector[j];
        }
      }

      // Compute eigenvalue (magnitude)
      eigenvalue = Math.sqrt(newVector.reduce((s, v) => s + v * v, 0));

      if (eigenvalue === 0) break;

      // Normalize
      vector = newVector.map(v => v / eigenvalue);
    }

    const varianceExplained = eigenvalue / totalVariance;
    cumulativeVariance += varianceExplained;

    // Build loadings
    const loadings: Record<string, number> = {};
    for (let i = 0; i < k; i++) {
      loadings[dimensions[i]] = Math.round(vector[i] * 1000) / 1000;
    }

    // Interpret the component
    const sortedLoadings = Object.entries(loadings)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    const topDims = sortedLoadings.slice(0, 3).map(([d]) => d);
    const interpretation = `Primarily captures: ${topDims.join(', ')}`;

    components.push({
      component_number: comp + 1,
      variance_explained: Math.round(varianceExplained * 1000) / 1000,
      cumulative_variance: Math.round(cumulativeVariance * 1000) / 1000,
      loadings,
      interpretation,
    });

    // Deflate: remove this component from the residual matrix
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        residualMatrix[i][j] -= eigenvalue * vector[i] * vector[j];
      }
    }
  }

  // Find components needed for 90% variance
  let componentsFor90 = components.length;
  for (let i = 0; i < components.length; i++) {
    if (components[i].cumulative_variance >= 0.9) {
      componentsFor90 = i + 1;
      break;
    }
  }

  // Find redundant pairs (high correlation)
  const corrObj = computeCorrelationMatrix(scoreMatrix);
  const redundantPairs: WeightOptimizationResult['pca_analysis']['redundant_pairs'] = [];
  for (let i = 0; i < dimensions.length; i++) {
    for (let j = i + 1; j < dimensions.length; j++) {
      const r = corrObj[dimensions[i]]?.[dimensions[j]] ?? 0;
      if (Math.abs(r) > 0.7) {
        redundantPairs.push({
          dimension_a: dimensions[i],
          dimension_b: dimensions[j],
          correlation: r,
        });
      }
    }
  }

  return {
    components_for_90_pct: componentsFor90,
    components,
    redundant_pairs: redundantPairs.sort(
      (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)
    ),
  };
}

// ============================================================================
// GRADIENT DESCENT WEIGHT OPTIMIZATION
// ============================================================================

/**
 * Optimize dimension weights using gradient descent to maximize
 * agreement with a target quality metric.
 *
 * The objective function is:
 *   minimize sum((weighted_qi - target_qi)^2)
 *
 * subject to:
 *   sum(weights) = 1.0
 *   weights[i] >= 0.03 (minimum weight per dimension)
 *   weights[i] <= 0.20 (maximum weight per dimension)
 *
 * @param scoreMatrix - Historical scores (array of score records)
 * @param targetQIs - Target quality indices for each essay
 * @param initialWeights - Starting weights
 * @param learningRate - Gradient descent step size
 * @param maxIterations - Maximum iterations
 */
export function optimizeWeights(
  scoreMatrix: Array<Record<string, number>>,
  targetQIs: number[],
  initialWeights: Record<string, number>,
  learningRate: number = 0.001,
  maxIterations: number = 1000
): WeightOptimizationResult {
  if (scoreMatrix.length !== targetQIs.length || scoreMatrix.length < 5) {
    return {
      original_weights: initialWeights,
      optimized_weights: initialWeights,
      weight_deltas: Object.fromEntries(
        Object.keys(initialWeights).map(k => [k, 0])
      ),
      r_squared: 0,
      pca_analysis: simplifiedPCA(scoreMatrix),
      metadata: {
        method: 'gradient_descent',
        iterations: 0,
        convergence: false,
        sample_size: scoreMatrix.length,
      },
    };
  }

  const dimensions = Object.keys(initialWeights);
  let weights = { ...initialWeights };
  const n = scoreMatrix.length;
  const minWeight = 0.03;
  const maxWeight = 0.20;

  let converged = false;
  let actualIterations = 0;
  let prevLoss = Infinity;

  for (let iter = 0; iter < maxIterations; iter++) {
    actualIterations = iter + 1;

    // Compute predicted QIs
    const predictedQIs = scoreMatrix.map(row => {
      let weightedSum = 0;
      for (const dim of dimensions) {
        weightedSum += (row[dim] || 0) * weights[dim];
      }
      return weightedSum * 10; // Scale to 0-100
    });

    // Compute loss (MSE)
    const loss = predictedQIs.reduce(
      (s, pred, i) => s + (pred - targetQIs[i]) ** 2,
      0
    ) / n;

    // Check convergence
    if (Math.abs(loss - prevLoss) < 1e-8) {
      converged = true;
      break;
    }
    prevLoss = loss;

    // Compute gradients
    const gradients: Record<string, number> = {};
    for (const dim of dimensions) {
      let grad = 0;
      for (let i = 0; i < n; i++) {
        const error = predictedQIs[i] - targetQIs[i];
        grad += 2 * error * (scoreMatrix[i][dim] || 0) * 10 / n;
      }
      gradients[dim] = grad;
    }

    // Update weights
    for (const dim of dimensions) {
      weights[dim] -= learningRate * gradients[dim];
      // Apply constraints
      weights[dim] = Math.max(minWeight, Math.min(maxWeight, weights[dim]));
    }

    // Normalize weights to sum to 1
    const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
    for (const dim of dimensions) {
      weights[dim] /= totalWeight;
    }
  }

  // Compute R-squared
  const predictedQIs = scoreMatrix.map(row => {
    let weightedSum = 0;
    for (const dim of dimensions) {
      weightedSum += (row[dim] || 0) * weights[dim];
    }
    return weightedSum * 10;
  });

  const meanTarget = targetQIs.reduce((s, v) => s + v, 0) / n;
  const ssRes = predictedQIs.reduce(
    (s, pred, i) => s + (pred - targetQIs[i]) ** 2,
    0
  );
  const ssTot = targetQIs.reduce(
    (s, target) => s + (target - meanTarget) ** 2,
    0
  );
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Compute deltas
  const deltas: Record<string, number> = {};
  for (const dim of dimensions) {
    deltas[dim] = Math.round((weights[dim] - initialWeights[dim]) * 10000) / 10000;
  }

  return {
    original_weights: initialWeights,
    optimized_weights: Object.fromEntries(
      Object.entries(weights).map(([k, v]) => [k, Math.round(v * 10000) / 10000])
    ),
    weight_deltas: deltas,
    r_squared: Math.round(rSquared * 1000) / 1000,
    pca_analysis: simplifiedPCA(scoreMatrix),
    metadata: {
      method: 'gradient_descent',
      iterations: actualIterations,
      convergence: converged,
      sample_size: n,
    },
  };
}
