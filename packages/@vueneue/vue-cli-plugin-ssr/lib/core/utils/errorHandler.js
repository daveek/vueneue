import Vue from 'vue';

export default (context, data) => {
  const { error, info, vm } = data;

  if (process.client) {
    if (process.env.NODE_ENV !== 'production') {
      Vue.util.warn(`Error in ${info}: "${error.toString()}"`, vm);
    } else if (process.env.VUE_APP_ENABLE_ERROR_LOGS) {
      // eslint-disable-next-line
      console.error(error.stack || error.message || error);
    }
  }

  const { store, router } = context;
  if (!data.statusCode) data.statusCode = 500;
  data.route = router.currentRoute;
  store.commit('errorHandler/SET', data);
};
