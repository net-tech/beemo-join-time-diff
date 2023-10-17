use anyhow::Context;
use humantime::format_duration;
use beemo_join_time_diff::*;
use chrono::Duration as ChronoDuration;

fn main() -> Result<(), anyhow::Error> {
    let text =
        fetch_log(&parse_arguments()?.get(1).with_context(|| {
            "Please provide a Beemo log link directly when running the command."
        })?)?;
    let (join_difference, zero_difference_indexes, match_amount) = parse_join_dates(&text)?;

    let average_join_difference = join_difference.iter().sum::<ChronoDuration>()
        / join_difference
            .len()
            .try_into()
            .with_context(|| "Unable to convert length to usize")?;
    let human_average_join_difference = format_duration(
        average_join_difference
            .to_std()
            .with_context(|| "Error converting ChronoDuration to Std Duration")?,
    );

    let zero_diff_occurrence = zero_difference_indexes.len() as f64 / match_amount as f64 * 100.0;

    println!("Analyzed {} joins. Average time between each join is {}. There were {} occurrences of two joins happening at the same time (0 ms apart). This accounts for {:.2}% of all joins.", match_amount, human_average_join_difference, zero_difference_indexes.len(), zero_diff_occurrence);
    Ok(())
}
