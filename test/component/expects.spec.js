const pactum = require('../../src/index');
const { like } = pactum.matchers;
const expect = require('chai').expect;
const fs = require('fs');

describe('Expects', () => {

  before(() => {
    const isUser = function (ctx) {
      const user = ctx.res.json;
      expect(user).deep.equals({ id: 1 });
    };
    pactum.handler.addExpectHandler('isUser', isUser);

    const hasAddress = function ({ res, data }) {
      const address = res.json;
      expect(address.type).equals(data);
    };
    pactum.handler.addExpectHandler('hasAddress', hasAddress);
  });

  it('custom expect handler', async () => {

    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/users/1'
        },
        willRespondWith: {
          status: 200,
          body: {
            id: 1
          }
        }
      })
      .get('http://localhost:9393/api/users/1')
      .expect('isUser')
      .expectStatus(200);
  });

  it('ad hoc expect handler', async () => {
    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/users/1'
        },
        willRespondWith: {
          status: 200,
          body: {
            id: 1
          }
        }
      })
      .get('http://localhost:9393/api/users/1')
      .expect(({ res }) => {
        expect(res.json).deep.equals({ id: 1 });
      })
      .expectStatus(200);
  });

  it('unknown custom expect handler', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expect('isAddress');
    } catch (error) {
      err = error;
    }
    expect(err.message).equals(`Expect Handler Not Found - 'isAddress'`);
  });

  it('failed custom expect handler with data', async () => {
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api/address/1'
          },
          willRespondWith: {
            status: 200,
            body: {
              type: 'WORK'
            }
          }
        })
        .get('http://localhost:9393/api/address/1')
        .expect('hasAddress', 'HOME');
    } catch (error) {
      err = error;
    }
    expect(err.message).equals(`expected 'WORK' to equal 'HOME'`);
  });

  it('failed ad hoc expect handler', async () => {
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api/users/1'
          },
          willRespondWith: {
            status: 200,
            body: {
              id: 1
            }
          }
        })
        .get('http://localhost:9393/api/users/1')
        .expect((res) => { expect(res.json).deep.equals({ id: 2 }); })
        .expectStatus(200);
    } catch (error) {
      err = error;
    }
    expect(err).not.undefined;
  });

  it('failed status code', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectStatus(200);
    } catch (error) {
      err = error;
    }
    expect(err.message).equals('HTTP status 404 !== 200');
  });

  it('header key not found', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectHeader('x-header', 'value');
    } catch (error) {
      err = error;
    }
    expect(err.message).equals(`Header 'x-header' not present in HTTP response`);
  });

  it('header value not found', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectHeader('connection', 'value');
    } catch (error) {
      err = error;
    }
    expect(err.message).equals(`Header value 'value' did not match for header 'connection': 'close'`);
  });

  it('header value not found - RegEx', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectHeader('connection', /value/);
    } catch (error) {
      err = error;
    }
    expect(err.message).equals(`Header regex (/value/) did not match for header 'connection': 'close'`);
  });

  it('header contains key not found', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectHeaderContains('x-header', 'value');
    } catch (error) {
      err = error;
    }
    expect(err.message).equals(`Header 'x-header' not present in HTTP response`);
  });

  it('header contains value not found', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectHeaderContains('connection', 'value');
    } catch (error) {
      err = error;
    }
    expect(err.message).equals(`Header value 'value' did not match for header 'connection': 'close'`);
  });

  it('header contains value not found - RegEx', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectHeaderContains('connection', /value/);
    } catch (error) {
      err = error;
    }
    expect(err.message).equals(`Header regex (/value/) did not match for header 'connection': 'close'`);
  });

  it('failed body', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectBody('Hello World');
    } catch (error) {
      err = error;
    }
    expect(err.message).contains('Interaction Not Found');
  });

  it('failed body contains', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectBodyContains('Hello World');
    } catch (error) {
      err = error;
    }
    expect(err.message).equals(`Value 'Hello World' not found in response body`);
  });

  it('failed body contains - RegEx', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectBodyContains(/Hello World/);
    } catch (error) {
      err = error;
    }
    expect(err.message).equals(`Value '/Hello World/' not found in response body`);
  });

  it('failed json like', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectJsonLike({ id: 1 });
    } catch (error) {
      err = error;
    }
    expect(err.message).equals(`Json doesn't have type 'object' at '$' but found 'string'`);
  });

  it('failed json schema', async () => {
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api/users/1'
          },
          willRespondWith: {
            status: 200,
            body: {
              id: 1
            }
          }
        })
        .get('http://localhost:9393/api/users/1')
        .expectJsonSchema({
          "required": ["userId", "id"]
        });
    } catch (error) {
      err = error;
    }
    expect(err).not.undefined;
  });

  it('failed json schema at', async () => {
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api/users/1'
          },
          willRespondWith: {
            status: 200,
            body: {
              id: 1
            }
          }
        })
        .get('http://localhost:9393/api/users/1')
        .expectJsonSchemaAt('id', {
          "type": "string"
        });
    } catch (error) {
      err = error;
    }
    expect(err).not.undefined;
  });

  it('failed json match', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectJsonMatch(like({ id: 1 }));
    } catch (error) {
      err = error;
    }
    expect(err.message).equals(`Json doesn't have type "object" at "$" but found "string"`);
  });

  it('network error', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9394/api/users/1')
        .expectJsonSchema({
          "required": ["userId", "id"]
        });
    } catch (error) {
      err = error;
    }
    expect(err).not.undefined;
  });

  it('interaction not exercised error', async () => {
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api'
          },
          willRespondWith: {
            status: 200
          }
        })
        .get('http://localhost:9393/api/users/1')
        .expectStatus(200);
    } catch (error) {
      err = error;
    }
    expect(err.message).contains('Interaction not exercised');
  });

  it('interaction not exercised error - with headers, body & matching', async () => {
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'POST',
            path: '/api',
            headers: {
              token: ''
            },
            body: {
              id: like(1)
            }
          },
          willRespondWith: {
            status: 200
          }
        })
        .get('http://localhost:9393/api/users/1')
        .expectStatus(200);
    } catch (error) {
      err = error;
    }
    expect(err.message).contains('Interaction not exercised');
  });

  it('interaction exercised error', async () => {
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api'
          },
          willRespondWith: {
            status: 200
          },
          expects: {
            exercised: false
          }
        })
        .get('http://localhost:9393/api')
        .expectStatus(200);
    } catch (error) {
      err = error;
    }
    expect(err.message).contains('Interaction exercised');
  });

  it('interaction call count error', async () => {
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api'
          },
          willRespondWith: {
            status: 200
          },
          expects: {
            callCount: 2
          }
        })
        .get('http://localhost:9393/api')
        .expectStatus(200);
    } catch (error) {
      err = error;
    }
    expect(err.message).contains('Interaction call count 1 !== 2');
  });

  it('json query - on root object', () => {
    return pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/users'
        },
        willRespondWith: {
          status: 200,
          body: {
            people: [
              { name: 'Matt', country: 'NZ' },
              { name: 'Pete', country: 'AU' },
              { name: 'Mike', country: 'NZ' }
            ]
          }
        }
      })
      .get('http://localhost:9393/api/users')
      .expectStatus(200)
      .expectJsonAt('people[country=NZ].name', 'Matt')
      .expectJsonAt('people[*].name', ['Matt', 'Pete', 'Mike']);
  });

  it('json query - on root array', () => {
    return pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/users'
        },
        willRespondWith: {
          status: 200,
          body: [
            { name: 'Matt', country: 'NZ' },
            { name: 'Pete', country: 'AU' },
            { name: 'Mike', country: 'NZ' }
          ]
        }
      })
      .get('http://localhost:9393/api/users')
      .expectStatus(200)
      .expectJsonAt('[1].country', 'AU')
      .expectJsonAt('[country=NZ].name', 'Matt')
      .expectJsonAt('[*].name', ['Matt', 'Pete', 'Mike']);
  });

  it('json query - on root object - fails', async () => {
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api/users'
          },
          willRespondWith: {
            status: 200,
            body: {
              people: [
                { name: 'Matt', country: 'NZ' },
                { name: 'Pete', country: 'AU' },
                { name: 'Mike', country: 'NZ' }
              ]
            }
          }
        })
        .get('http://localhost:9393/api/users')
        .expectStatus(200)
        .expectJsonAt('people[country=NZ].name', 'Matt')
        .expectJsonAt('people[*].name', ['Matt', 'Pete']);
    } catch (error) {
      err = error;
    }
    expect(err).not.undefined;
  });

  it('json query like - on root object', () => {
    return pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/users'
        },
        willRespondWith: {
          status: 200,
          body: {
            people: [
              { name: 'Matt', country: 'NZ' },
              { name: 'Pete', country: 'AU' },
              { name: 'Mike', country: 'NZ' }
            ]
          }
        }
      })
      .get('http://localhost:9393/api/users')
      .expectStatus(200)
      .expectJsonLikeAt('people[*].name', ['Matt', 'Pete']);
  });

  it('json query like - fails', async () => {
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api/users'
          },
          willRespondWith: {
            status: 200,
            body: {
              people: [
                { name: 'Matt', country: 'NZ' },
                { name: 'Pete', country: 'AU' },
                { name: 'Mike', country: 'NZ' }
              ]
            }
          }
        })
        .get('http://localhost:9393/api/users')
        .expectStatus(200)
        .expectJsonLikeAt('people[*].name', ['Matt', 'Pet']);
    } catch (error) {
      err = error;
    }
    expect(err).not.undefined;
  });

  it('failed response time', async () => {
    let err;
    try {
      await pactum.spec()
        .get('http://localhost:9393/api/users/1')
        .expectResponseTime(-1);
    } catch (error) {
      err = error;
    }
    expect(err.message).contains(`Request took longer than -1ms`);
  });

  it('json match at', async () => {
    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/users'
        },
        willRespondWith: {
          status: 200,
          body: {
            people: [
              { name: 'Matt', country: 'NZ' },
              { name: 'Pete', country: 'AU' },
              { name: 'Mike', country: 'NZ' }
            ]
          }
        }
      })
      .get('http://localhost:9393/api/users')
      .expectStatus(200)
      .expectJsonMatchAt('people[*].name', pactum.matchers.eachLike('Matt'));
  });

  it('json match at - fails', async () => {
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api/users'
          },
          willRespondWith: {
            status: 200,
            body: {
              people: [
                { name: 'Matt', country: 'NZ' },
                { name: 'Pete', country: 'AU' },
                { name: 'Mike', country: 'NZ' }
              ]
            }
          }
        })
        .get('http://localhost:9393/api/users')
        .expectStatus(200)
        .expectJsonMatchAt('people[*].name', pactum.matchers.eachLike(12));
    } catch (error) {
      err = error;
    }
    expect(err).not.undefined;
  });

  it('json snapshot - deep equal', async () => {
    await pactum.spec()
      .useMockInteraction('get people')
      .name('json snapshot - deep equal')
      .get('http://localhost:9393/api/people')
      .expectStatus(200)
      .expectJsonSnapshot();
    await pactum.spec()
      .useMockInteraction('get people')
      .name('json snapshot - deep equal')
      .get('http://localhost:9393/api/people')
      .expectStatus(200)
      .expectJsonSnapshot();
    fs.unlinkSync(`.pactum/snapshots/json snapshot - deep equal.json`);
  });

  it('json snapshot - deep equal - fails', async () => {
    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/users/1'
        },
        willRespondWith: {
          status: 200,
          body: {
            id: 'random-id',
            name: 'snow'
          }
        }
      })
      .name('json snapshot - deep equal')
      .get('http://localhost:9393/api/users/1')
      .expectStatus(200)
      .expectJsonSnapshot();
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api/users/1'
          },
          willRespondWith: {
            status: 200,
            body: {
              id: 'random-ids',
              name: 'snow'
            }
          }
        })
        .name('json snapshot - deep equal')
        .get('http://localhost:9393/api/users/1')
        .expectStatus(200)
        .expectJsonSnapshot();
    } catch (error) {
      err = error;
    }
    fs.unlinkSync(`.pactum/snapshots/json snapshot - deep equal.json`);
    expect(err).not.undefined;
  });

  it('json snapshot - with matchers', async () => {
    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/users/1'
        },
        willRespondWith: {
          status: 200,
          body: {
            id: 'random-id',
            name: 'snow'
          }
        }
      })
      .name('json snapshot - with matchers')
      .get('http://localhost:9393/api/users/1')
      .expectStatus(200)
      .expectJsonSnapshot({
        id: like('id')
      });
    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/users/1'
        },
        willRespondWith: {
          status: 200,
          body: {
            id: 'random-id',
            name: 'snow'
          }
        }
      })
      .name('json snapshot - with matchers')
      .get('http://localhost:9393/api/users/1')
      .expectStatus(200)
      .expectJsonSnapshot({
        id: like('id')
      });
    fs.unlinkSync(`.pactum/snapshots/json snapshot - with matchers.json`);
  });

  it('json snapshot - with matchers - fails with extra property', async () => {
    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/users/1'
        },
        willRespondWith: {
          status: 200,
          body: {
            id: 'random-id',
            name: 'snow'
          }
        }
      })
      .name('json snapshot - with matchers')
      .get('http://localhost:9393/api/users/1')
      .expectStatus(200)
      .expectJsonSnapshot({
        id: like('id')
      });
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api/users/1'
          },
          willRespondWith: {
            status: 200,
            body: {
              id: 'random-id',
              name: 'snow',
              age: 2
            }
          }
        })
        .name('json snapshot - with matchers')
        .get('http://localhost:9393/api/users/1')
        .expectStatus(200)
        .expectJsonSnapshot({
          id: like('id')
        });
    } catch (error) {
      err = error;
    }
    fs.unlinkSync(`.pactum/snapshots/json snapshot - with matchers.json`);
    expect(err).not.undefined;
  });

  it('json snapshot - with matchers - fails with matcher', async () => {
    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/api/users/1'
        },
        willRespondWith: {
          status: 200,
          body: {
            id: 'random-id',
            name: 'snow'
          }
        }
      })
      .name('json snapshot - with matchers')
      .get('http://localhost:9393/api/users/1')
      .expectStatus(200)
      .expectJsonSnapshot({
        id: like('id')
      });
    let err;
    try {
      await pactum.spec()
        .useMockInteraction({
          withRequest: {
            method: 'GET',
            path: '/api/users/1'
          },
          willRespondWith: {
            status: 200,
            body: {
              id: 1,
              name: 'snow'
            }
          }
        })
        .name('json snapshot - with matchers')
        .get('http://localhost:9393/api/users/1')
        .expectStatus(200)
        .expectJsonSnapshot({
          id: like('id')
        });
    } catch (error) {
      err = error;
    }
    fs.unlinkSync(`.pactum/snapshots/json snapshot - with matchers.json`);
    expect(err).not.undefined;
  });

});