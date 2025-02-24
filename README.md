# Jan Todoist Plugin

A Jan AI plugin that integrates with Todoist, allowing you to manage your tasks directly from Jan.

## Features

- Add tasks to your Todoist account
- List projects from your Todoist account
- View active tasks
- Complete tasks
- Natural language processing for task creation

## Installation

1. Download the latest release (`jan-todoist-plugin-1.0.0.tgz`)
2. Open Jan AI, go to Settings > Extensions
3. Click "Install Extension" and select the downloaded file
4. Restart Jan AI

## Configuration

You need to provide your Todoist API token for the plugin to work:

1. Get your API token from Todoist (Settings > Integrations > API token)
2. In Jan AI, use the following command to set up your token:

```
/todoist setup token YOUR_API_TOKEN
```

## Usage

The plugin provides several commands to interact with Todoist:

### Adding Tasks

```
/todoist add Buy milk tomorrow
/todoist add Finish report by Friday in Work
```

### Viewing Tasks

```
/todoist tasks
/todoist tasks today
/todoist tasks project:Work
```

### Viewing Projects

```
/todoist projects
```

### Completing Tasks

```
/todoist complete TASK_ID
```

## Development

If you want to build the plugin from source:

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the plugin:
   ```
   npm run build
   ```
4. Package the plugin:
   ```
   npm run bundle
   ```

## License

MIT