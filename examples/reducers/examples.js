// Action types
export const SET_EXAMPLE = 'examples/SET_EXAMPLE';

export const EXAMPLES = [
  {
    id: 'simple',
    name: 'Simple'
  },
  {
    id: 'clmImage',
    name: 'Clm Image'
  },
  {
    id: 'clmVideo',
    name: 'Clm Video'
  },
  {
    id: 'faceDeformationVideo',
    name: 'Face Deformation Video'
  },
  {
    id: 'faceMask',
    name: 'Face Mask'
  }
];


export const getExample = (id) => {
  return _.find(EXAMPLES, { id });
};


// Action generators
export const setExample = (example) => {
  if (typeof example === 'object') {
    example = example.id;
  }
  return { type: SET_EXAMPLE, value: example };
};


// The reducers
const DEFAULT_STATE = {
  activeExample: EXAMPLES[0].id
};

export default function (state = DEFAULT_STATE, action) {
  switch (action.type) {
    case SET_EXAMPLE:
      return Object.assign({}, state, {
        activeExample: action.value
      });
    default:
      return state
  }
};
