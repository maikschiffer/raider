export const rules = {
  data: () => ({
    usernameRegex: /^@?[a-zA-Z0-9_][a-zA-Z0-9_.]*$/,
    postRegex: /(?:https?:\/\/)?(?:www\.)?(:?instagram\.com)?\/?p\/([a-zA-Z0-9_-]+)\/?$/,
    sessionNameRegex: /^[A-Za-z][A-Za-z ]*$/
  }),
  computed: {
    rules () {
      return {
        required: value => !!value || 'Required',
        validTimeout: value => (value >= 60 && value <= 300) || 'Enter a number between 60 and 300',
        validMaxPosts: value => (value >= 10 && value <= 200) || 'Enter a number between 10 and 200',
        validSleepTimer: value => value >= 5 || 'Invalid. The minimum is 5 seconds',
        validInput: value => (value && (this.usernameRegex.test(value) || this.postRegex.test(value))) || 'Unknown format',
        validUsername: value => (value && this.usernameRegex.test(value)) || 'Unknown format',
        validSessionName: value => (value && this.sessionNameRegex.test(value)) || 'Invalid session name'
      }
    }
  }
}
