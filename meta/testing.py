import os
import pyspark.sql.functions as F
import pyspark.sql.types as T
from utilities import SEED
# import any other dependencies you want, but make sure only to use the ones
# availiable on AWS EMR
from pyspark import StorageLevel
from pyspark.ml import feature, stat
from pyspark.ml.regression import DecisionTreeRegressor
from pyspark.ml.evaluation import RegressionEvaluator


# ---------------- choose input format, dataframe or rdd ----------------------
INPUT_FORMAT = 'dataframe'  # change to 'rdd' if you wish to use rdd inputs
# -----------------------------------------------------------------------------
if INPUT_FORMAT == 'dataframe':
    import pyspark.ml as M
    import pyspark.sql.functions as F
    import pyspark.sql.types as T
    from pyspark.ml.regression import DecisionTreeRegressor
    from pyspark.ml.evaluation import RegressionEvaluator
if INPUT_FORMAT == 'koalas':
    import databricks.koalas as ks
elif INPUT_FORMAT == 'rdd':
    import pyspark.mllib as M
    from pyspark.mllib.feature import Word2Vec
    from pyspark.mllib.linalg import Vectors
    from pyspark.mllib.linalg.distributed import RowMatrix
    from pyspark.mllib.tree import DecisionTree
    from pyspark.mllib.regression import LabeledPoint
    from pyspark.mllib.linalg import DenseVector
    from pyspark.mllib.evaluation import RegressionMetrics


# ---------- Begin definition of helper functions, if you need any ------------

# def task_1_helper():
#   pass

# -----------------------------------------------------------------------------


def task_1(data_io, review_data, product_data):
    # -----------------------------Column names--------------------------------
    # Inputs:
    asin_column = 'asin'
    overall_column = 'overall'
    # Outputs:
    mean_rating_column = 'meanRating'
    count_rating_column = 'countRating'
    # -------------------------------------------------------------------------

    # ---------------------- Your implementation begins------------------------


    rating_aggregates = review_data.groupby(asin_column).agg(
        F.avg(overall_column).alias(mean_rating_column),
        F.count(overall_column).alias(count_rating_column)
    )

    full_product_info = product_data.join(
        rating_aggregates,
        on=asin_column,
        how='left'
    )
    
    summary = full_product_info.agg(
        F.avg(count_rating_column).alias('mean_countRating'),
        F.avg(mean_rating_column).alias('mean_meanRating'),
        F.variance(mean_rating_column).alias('variance_meanRating'),
        F.sum(F.when(F.col(mean_rating_column).isNull(),
                     1).otherwise(0)).alias('numNulls_meanRating'),
        F.count('*').alias('count_total'),
        F.variance(count_rating_column).alias('variance_countRating'),
        F.sum(F.when(F.col(count_rating_column).isNull(),
                     1).otherwise(0)).alias('numNulls_countRating')
    ).first()


    # -------------------------------------------------------------------------

    # ---------------------- Put results in res dict --------------------------
    # Calculate the values programmaticly. Do not change the keys and do not
    # hard-code values in the dict. Your submission will be evaluated with
    # different inputs.
    # Modify the values of the following dictionary accordingly.
    res = {
        'variance_countRating': summary['variance_countRating'],
        'count_total': summary['count_total'],
        'mean_meanRating': summary['mean_meanRating'],
        'variance_meanRating': summary['variance_meanRating'],
        'numNulls_meanRating': summary['numNulls_meanRating'],
        'mean_countRating': summary['mean_countRating'],
        'numNulls_countRating': summary['numNulls_countRating']
    }




    # -------------------------------------------------------------------------

    # ----------------------------- Do not change -----------------------------
    data_io.save(res, 'task_1')
    return res
    # -------------------------------------------------------------------------


def task_2(data_io, product_data):
    # -----------------------------Column names--------------------------------
    # Inputs:
    salesRank_column = 'salesRank'
    categories_column = 'categories'
    asin_column = 'asin'
    # Outputs:
    category_column = 'category'
    bestSalesCategory_column = 'bestSalesCategory'
    bestSalesRank_column = 'bestSalesRank'
    # -------------------------------------------------------------------------

    # ---------------------- Your implementation begins------------------------

    df = product_data.withColumn(
        bestSalesRank_column,
        F.when(
            (F.size(F.col(salesRank_column)) == 0) | F.col(salesRank_column).isNull(),
            F.lit(None)
        ).otherwise(F.map_values(F.col(salesRank_column)).getItem(0))
    )
    
    df = df.withColumn(
        category_column,
        F.when(
            (F.size(F.col(categories_column).getItem(0)) == 0) |
            (F.col(categories_column).isNull()) |
            (F.col(categories_column).getItem(0).getItem(0) == "") |
            (F.size(F.col(categories_column)) == 0),
            F.lit(None)
        ).otherwise(F.col(categories_column).getItem(0).getItem(0))
    )

    
    df = df.withColumn(
        bestSalesCategory_column,
        F.when(
             (F.size(F.col(salesRank_column)) == 0) | F.col(salesRank_column).isNull(),
            F.lit(None)
        ).otherwise(F.map_keys(F.col(salesRank_column)).getItem(0))
    )

    # Step 3: Aggregate result statistics
    summary_row = df.select(category_column, bestSalesCategory_column, bestSalesRank_column).agg(
        F.count('*').alias('count_total'),
        F.sum(F.when(F.col(bestSalesCategory_column).isNull(), 1).otherwise(0)).alias('numNulls_bestSalesCategory'),
        F.variance(bestSalesRank_column).alias('variance_bestSalesRank'),
        F.sum(F.when(F.col(category_column).isNull(), 1).otherwise(0)).alias('numNulls_category'),
        F.avg(bestSalesRank_column).alias('mean_bestSalesRank'),
        F.countDistinct(F.when(F.col(bestSalesCategory_column).isNotNull(), 
        F.col(bestSalesCategory_column))).alias('countDistinct_bestSalesCategory'),
        F.countDistinct(F.when(F.col(category_column).isNotNull(), F.col(category_column))).alias('countDistinct_category')
    ).first()



    # -------------------------------------------------------------------------

    # ---------------------- Put results in res dict --------------------------
    res = {
        'mean_bestSalesRank': summary_row['mean_bestSalesRank'],
        'numNulls_bestSalesCategory': summary_row['numNulls_bestSalesCategory'],
        'variance_bestSalesRank': summary_row['variance_bestSalesRank'],
        'numNulls_category': summary_row['numNulls_category'],
        'count_total': summary_row['count_total'],
        'countDistinct_bestSalesCategory': summary_row['countDistinct_bestSalesCategory'],
        'countDistinct_category': summary_row['countDistinct_category'],
    }




    # -------------------------------------------------------------------------

    # ----------------------------- Do not change -----------------------------
    data_io.save(res, 'task_2')
    return res
    # -------------------------------------------------------------------------


def task_3(data_io, product_data):
    # -----------------------------Column names--------------------------------
    # Inputs:
    asin_column = 'asin'
    price_column = 'price'
    attribute = 'also_viewed'
    related_column = 'related'
    # Outputs:
    meanPriceAlsoViewed_column = 'meanPriceAlsoViewed'
    countAlsoViewed_column = 'countAlsoViewed'
    # -------------------------------------------------------------------------

    # ---------------------- Your implementation begins------------------------
        
    view = F.col(related_column).getItem(attribute)

    df = product_data.withColumn('viewed_products', view)
    df = df.withColumn(
        countAlsoViewed_column,
        F.when(F.col('viewed_products').isNotNull(), F.size(F.col('viewed_products')))
    )

    prices = (
        df.select(F.col(asin_column).alias("og"), F.explode_outer("viewed_products").alias("related_asin"))
        .join(
            product_data.select(asin_column, price_column),
            F.col("related_asin") == F.col(asin_column),
            how='inner'
        )
        .groupBy("og")
        .agg(F.avg(price_column).alias(meanPriceAlsoViewed_column))
    )

    df = df.join(prices, df[asin_column] == prices["og"], how="left")

    stats = df.agg(
        F.count('*').alias('count_total'),
        F.avg(meanPriceAlsoViewed_column).alias('mean_meanPriceAlsoViewed'),
        F.variance(meanPriceAlsoViewed_column).alias('variance_meanPriceAlsoViewed'),
        F.sum(F.when(F.col(meanPriceAlsoViewed_column).isNull(), 1).otherwise(0)).alias('numNulls_meanPriceAlsoViewed'),
        F.avg(countAlsoViewed_column).alias('mean_countAlsoViewed'),
        F.variance(countAlsoViewed_column).alias('variance_countAlsoViewed'),
        F.sum(F.when(F.col(countAlsoViewed_column).isNull(), 1).otherwise(0)).alias('numNulls_countAlsoViewed')
    ).first()


    # ---------------------- Put results in res dict --------------------------
    res = {
        'mean_countAlsoViewed': stats['mean_countAlsoViewed'],
        'numNulls_countAlsoViewed': stats['numNulls_countAlsoViewed'],
        'numNulls_meanPriceAlsoViewed': stats['numNulls_meanPriceAlsoViewed'],
        'count_total': stats['count_total'],
        'mean_meanPriceAlsoViewed': stats['mean_meanPriceAlsoViewed'],
        'variance_countAlsoViewed': stats['variance_countAlsoViewed'],
        'variance_meanPriceAlsoViewed': stats['variance_meanPriceAlsoViewed']
    }


    # -------------------------------------------------------------------------

    # ----------------------------- Do not change -----------------------------
    data_io.save(res, 'task_3')
    return res
    # -------------------------------------------------------------------------


def task_4(data_io, product_data):
    # -----------------------------Column names--------------------------------
    # Inputs:
    price_column = 'price'
    title_column = 'title'
    # Outputs:
    meanImputedPrice_column = 'meanImputedPrice'
    medianImputedPrice_column = 'medianImputedPrice'
    unknownImputedTitle_column = 'unknownImputedTitle'
    # -------------------------------------------------------------------------

    # ---------------------- Your implementation begins------------------------
    # Cast price to float
    df = product_data.withColumn(price_column, F.col(price_column).cast('float'))

    # Persist it in memory/disk to avoid recomputation
    df = df.persist(StorageLevel.MEMORY_AND_DISK)

    # Calculate mean and median
    mean_price = df.select(F.avg(price_column)).first()[0]
    median_price = df.approxQuantile(price_column, [0.5], 0.01)[0]

    # Conditions for imputation
    is_price_null = F.col(price_column).isNull()
    is_title_invalid = F.col(title_column).isNull() | (F.trim(F.col(title_column)) == '')

    # Apply imputations
    df = df.withColumns({
        meanImputedPrice_column: F.when(is_price_null, mean_price).otherwise(F.col(price_column)),
        medianImputedPrice_column: F.when(is_price_null, median_price).otherwise(F.col(price_column)),
        unknownImputedTitle_column: F.when(is_title_invalid, F.lit('unknown')).otherwise(F.col(title_column))
    })

    # Materialize the result columns to avoid recomputation in multiple actions
    df = df.persist(StorageLevel.MEMORY_AND_DISK)

    # Compute summary statistics safely
    count_total = df.count()
    mean_meanImputedPrice = df.select(F.avg(meanImputedPrice_column)).first()[0]
    variance_meanImputedPrice = df.select(F.variance(meanImputedPrice_column)).first()[0]
    numNulls_meanImputedPrice = df.filter(F.col(meanImputedPrice_column).isNull()).count()

    mean_medianImputedPrice = df.select(F.avg(medianImputedPrice_column)).first()[0]
    variance_medianImputedPrice = df.select(F.variance(medianImputedPrice_column)).first()[0]
    numNulls_medianImputedPrice = df.filter(F.col(medianImputedPrice_column).isNull()).count()

    numUnknowns_unknownImputedTitle = df.filter(F.col(unknownImputedTitle_column) == 'unknown').count()


    # -------------------------------------------------------------------------

    # ---------------------- Put results in res dict --------------------------
    res = {
        'variance_medianImputedPrice': variance_medianImputedPrice,
        'mean_meanImputedPrice': mean_meanImputedPrice,
        'numUnknowns_unknownImputedTitle': numUnknowns_unknownImputedTitle,
        'count_total': count_total,
        'mean_medianImputedPrice': mean_medianImputedPrice,
        'variance_meanImputedPrice': variance_meanImputedPrice,
        'numNulls_medianImputedPrice': numNulls_medianImputedPrice,
        'numNulls_meanImputedPrice': numNulls_meanImputedPrice
    }
    


    # -------------------------------------------------------------------------

    # ----------------------------- Do not change -----------------------------
    data_io.save(res, 'task_4')
    return res
    # -------------------------------------------------------------------------


def task_5(data_io, product_processed_data, word_0, word_1, word_2):
    # -----------------------------Column names--------------------------------
    # Inputs:
    title_column = 'title'
    # Outputs:
    titleArray_column = 'titleArray'
    titleVector_column = 'titleVector'
    # -------------------------------------------------------------------------

    # ---------------------- Your implementation begins------------------------

    product_processed_data_output = product_processed_data.withColumn(
        titleArray_column, 
        F.split(F.lower(F.col(title_column)), " ")
    ).cache()

    model = M.feature.Word2Vec(
        inputCol=titleArray_column,
        outputCol=titleVector_column,
        minCount=100,
        vectorSize=16,
        seed=SEED,
        numPartitions=4
    ).fit(product_processed_data_output)



    # -------------------------------------------------------------------------

    # ---------------------- Put results in res dict --------------------------
    res = {
        'count_total': product_processed_data_output.count(),
        'size_vocabulary': model.getVectors().count(),
        'word_0_synonyms': [(None, None), ],
        'word_1_synonyms': [(None, None), ],
        'word_2_synonyms': [(None, None), ]
    }
    # Modify res:
    
    for name, word in zip(
        ['word_0_synonyms', 'word_1_synonyms', 'word_2_synonyms'],
        [word_0, word_1, word_2]
    ):
        res[name] = model.findSynonymsArray(word, 10)


    # -------------------------------------------------------------------------

    # ----------------------------- Do not change -----------------------------
    data_io.save(res, 'task_5')
    return res
    # -------------------------------------------------------------------------


def task_6(data_io, product_processed_data):
    # -----------------------------Column names--------------------------------
    # Inputs:
    category_column = 'category'
    # Outputs:
    categoryIndex_column = 'categoryIndex'
    categoryOneHot_column = 'categoryOneHot'
    categoryPCA_column = 'categoryPCA'
    # -------------------------------------------------------------------------    

    # ---------------------- Your implementation begins------------------------
    
    # 1. Index categorical strings to numerical indices
    indexer = feature.StringIndexer(inputCol=category_column, outputCol=categoryIndex_column)
    indexed_df = indexer.fit(product_processed_data).transform(product_processed_data)

    # 2. One-hot encode the indexed categories
    encoder = feature.OneHotEncoder(inputCol=categoryIndex_column, outputCol=categoryOneHot_column, dropLast=False)
    encoded_df = encoder.fit(indexed_df).transform(indexed_df)

    # 3. Apply PCA to the one-hot vectors
    pca = feature.PCA(k=15, inputCol=categoryOneHot_column, outputCol=categoryPCA_column)
    pca_df = pca.fit(encoded_df).transform(encoded_df)

    # 4. Persist final transformed DataFrame before aggregating
    pca_df = pca_df.persist(StorageLevel.MEMORY_AND_DISK)

    # 5. Calculate mean vectors using ML.stat.Summarizer
    summarizer = stat.Summarizer

    one_hot_summary = pca_df.select(summarizer.mean(F.col(categoryOneHot_column)).alias("mean_vec_onehot")).first()
    pca_summary = pca_df.select(summarizer.mean(F.col(categoryPCA_column)).alias("mean_vec_pca")).first()

    one_hot_mean = one_hot_summary["mean_vec_onehot"].toArray().tolist()
    pca_mean = pca_summary["mean_vec_pca"].toArray().tolist()

    # -------------------------------------------------------------------------

    # ---------------------- Put results in res dict --------------------------
    res = {
        'count_total': pca_df.count(),
        'meanVector_categoryOneHot': one_hot_mean,
        'meanVector_categoryPCA': pca_mean
    }
    # -------------------------------------------------------------------------

    # ----------------------------- Do not change -----------------------------
    data_io.save(res, 'task_6')
    return res
    # -------------------------------------------------------------------------
    
    
def task_7(data_io, train_data, test_data):
    # ---------------------- Your implementation begins------------------------
    
    # Persist training data to avoid recomputation during fitting
    train_data = train_data.persist(StorageLevel.MEMORY_AND_DISK)
    
    dt_regressor = DecisionTreeRegressor(
        featuresCol='features',
        labelCol='overall',
        maxDepth=5  # required max depth
    )

    model = dt_regressor.fit(train_data)

    # Optionally persist test data if reused (here just once, so not mandatory)
    test_data = test_data.persist(StorageLevel.MEMORY_AND_DISK)
    predictions = model.transform(test_data)

    # Evaluate RMSE on predictions
    evaluator = RegressionEvaluator(
        labelCol='overall',
        predictionCol='prediction',
        metricName='rmse'
    )
    test_rmse = evaluator.evaluate(predictions)

    # ---------------------- Put results in res dict --------------------------
    res = {
        'test_rmse': test_rmse
    }
    # -------------------------------------------------------------------------

    # ----------------------------- Do not change -----------------------------
    data_io.save(res, 'task_7')
    return res
    # -------------------------------------------------------------------------
    
    
def task_8(data_io, train_data, test_data):
    
    # ---------------------- Your implementation begins------------------------
    the_mse = {
        '5': None,
        '7': None,
        '9': None,
        '12': None,
    }
    for depth in [5, 7, 9, 12]:
        dt = M.regression.DecisionTreeRegressor(
            featuresCol="features", 
            labelCol="overall", 
            maxDepth=depth)
        model = dt.fit(train_data)
        predictions = model.transform(test_data)
        def calculate_rmse(predictions):
            squared_diff = (F.col("overall") - F.col("prediction")) ** 2
            mse = predictions.select(F.sqrt(F.avg(squared_diff)).alias("rmse")).collect()[0]["rmse"]
            return mse
        test_rmse = calculate_rmse(predictions)
        the_mse[str(depth)] = test_rmse
        
    # -------------------------------------------------------------------------
    
    
    # ---------------------- Put results in res dict --------------------------
    res = {
        'test_rmse': None,
        'valid_rmse_depth_5': None,
        'valid_rmse_depth_7': None,
        'valid_rmse_depth_9': None,
        'valid_rmse_depth_12': None,
    }
    # Modify res:
    res['test_rmse'] = the_mse['12']
    res['valid_rmse_depth_5'] = the_mse['5']
    res['valid_rmse_depth_7'] = the_mse['7']
    res['valid_rmse_depth_9'] = the_mse['9']
    res['valid_rmse_depth_12'] = the_mse['12']
 
    # -------------------------------------------------------------------------

    # ----------------------------- Do not change -----------------------------
    data_io.save(res, 'task_8')
    return res
    # -------------------------------------------------------------------------