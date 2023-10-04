import {
  searchClient,
  dataset,
  Movies,
  meilisearchClient,
} from './assets/utils'

describe('Instant Meilisearch Browser test', () => {
  beforeAll(async () => {
    const deleteTask = await meilisearchClient.deleteIndex('movies')
    await meilisearchClient.waitForTask(deleteTask.taskUid)
    await meilisearchClient
      .index('movies')
      .updateFilterableAttributes([
        'genres',
        'title',
        'release_date',
        'escape_\\_"me"',
      ])
    const documentsTask = await meilisearchClient
      .index('movies')
      .addDocuments(dataset)
    await meilisearchClient.index('movies').waitForTask(documentsTask.taskUid)
  })

  test('one string facet on filter without a query', async () => {
    const response = await searchClient.search<Movies>([
      {
        indexName: 'movies',
        params: {
          query: '',
          facetFilters: ['genres:Adventure'],
        },
      },
    ])

    const hits = response.results[0].hits
    expect(hits.length).toEqual(1)
    expect(hits[0].title).toEqual('Star Wars')
  })

  test('one facet on filter with a query', async () => {
    const response = await searchClient.search<Movies>([
      {
        indexName: 'movies',
        params: {
          query: 'four',
          facetFilters: ['genres:Crime'],
        },
      },
    ])

    const hits = response.results[0].hits
    expect(hits.length).toEqual(2)
    expect(hits[0].title).toEqual('Four Rooms')
  })

  test('multiple on filter without a query', async () => {
    const response = await searchClient.search<Movies>([
      {
        indexName: 'movies',
        params: {
          query: '',
          facetFilters: ['genres:Comedy', 'genres:Crime'],
        },
      },
    ])

    const hits = response.results[0].hits
    expect(hits.length).toEqual(2)
    expect(hits[0].title).toEqual('Ariel')
  })

  test('multiple on filter with a query', async () => {
    const response = await searchClient.search<Movies>([
      {
        indexName: 'movies',
        params: {
          query: 'ar',
          facetFilters: ['genres:Comedy', 'genres:Crime'],
        },
      },
    ])

    const hits = response.results[0].hits

    expect(hits.length).toEqual(2)
    expect(hits[0].title).toEqual('Ariel')
  })

  test('multiple nested on filter with a query', async () => {
    const params = {
      indexName: 'movies',
      params: {
        query: 'night',
        facetFilters: [['genres:action', 'genres:Thriller'], ['genres:crime']],
      },
    }

    const response = await searchClient.search<Movies>([params])

    const hits = response.results[0].hits
    expect(hits[0].title).toEqual('Judgment Night')
  })

  test('multiple nested array in filter without a query', async () => {
    const params = {
      indexName: 'movies',
      params: {
        query: '',
        facetFilters: [['genres:action', 'genres:Thriller'], ['genres:crime']],
      },
    }

    const response = await searchClient.search<Movies>([params])

    const hits = response.results[0].hits
    expect(hits[0].title).toEqual('Judgment Night')
  })

  test('multiple nested arrays on filter with a query', async () => {
    const params = {
      indexName: 'movies',
      params: {
        query: 'ar',
        facetFilters: [['genres:Drama', 'genres:Thriller'], ['title:Ariel']],
      },
    }

    const response = await searchClient.search<Movies>([params])

    const hits = response.results[0].hits
    expect(hits[0].title).toEqual('Ariel')
  })

  test('multiple nested arrays on filter without a query', async () => {
    const params = {
      indexName: 'movies',
      params: {
        query: '',
        facetFilters: [['genres:Drama', 'genres:Thriller'], ['title:Ariel']],
      },
    }

    const response = await searchClient.search<Movies>([params])

    const hits = response.results[0].hits
    expect(hits[0].title).toEqual('Ariel')
  })

  test('numeric filter', async () => {
    const params = {
      indexName: 'movies',
      params: {
        query: '',
        numericFilters: 'release_date:593395200 TO 818467200',
      },
    }

    const response = await searchClient.search<Movies>([params])

    const hits = response.results[0].hits
    expect(hits.length).toEqual(3)
    expect(hits.map((v) => v.release_date).sort()).toEqual([
      593395200, 750643200, 818467200,
    ])
  })

  test('quotation marks and backslashes', () => {
    const params = {
      indexName: 'movies',
      params: {
        query: '',
        facetFilters: 'escape_\\_"me":escape \\"me too"',
      },
    }

    return expect(searchClient.search<Movies>([params])).resolves.toBeTruthy()
  })
})
