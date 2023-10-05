# Beemo Log Analyzer

Welcome to the Beemo Log Analyzer! This Rust application processes and analyzes Beemo logs, providing insightful data regarding join dates and times.

## Getting Started

These instructions will help you get a copy of the project up and running on your local machine.

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install): You will need Rust and Cargo (Rust’s build system and package manager) installed on your machine. Visit the link to install it.

### Downloading the Code

1. **Clone the Repository:**
    ```sh
    git clone https://github.com/net-tech/beemo-join-time-diff.git
    ```

2. **Navigate to the Repository:**
    ```sh
    cd beemo-join-time-diff
    ```

### Running the Code

1. **Build the Project:**
    ```sh
    cargo build --release
    ```

2. **Run the Project:**
    ```sh
    cargo run --release -- [Beemo log URL]
    ```
    Replace `[Beemo log URL]` with the Beemo log URL you want to analyze.

## Usage

After installing you can just run


```sh
cargo run --release -- [Beemo log URL]
```

## Contributing

Feel free to fork the project, open a PR, or submit issues with feature requests or bug reports. Every contribution is appreciated!

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
